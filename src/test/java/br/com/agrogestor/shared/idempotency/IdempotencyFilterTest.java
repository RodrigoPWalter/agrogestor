package br.com.agrogestor.shared.idempotency;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IdempotencyFilterTest {

    private static final UUID USER_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private IdempotencyService service;
    private PlatformTransactionManager manager;
    private IdempotencyFilter filter;
    private SimpleTransactionStatus transactionStatus;

    @BeforeEach
    void setUp() {
        service = mock(IdempotencyService.class);
        manager = mock(PlatformTransactionManager.class);
        transactionStatus = new SimpleTransactionStatus();
        when(manager.getTransaction(any())).thenReturn(transactionStatus);
        filter = new IdempotencyFilter(service, manager);
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(USER_ID.toString(), null, List.of()));
    }

    @AfterEach
    void cleanUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldRememberSuccessfulMutationUsingAuthenticatedImmutableIdentity() throws Exception {
        var response = new MockHttpServletResponse();
        filter.doFilter(request("operation-1"), response, successChain());

        var captor = ArgumentCaptor.forClass(IdempotencyRecord.class);
        var order = inOrder(service, manager);
        order.verify(service).lockUser(USER_ID);
        order.verify(service).find(USER_ID.toString(), "operation-1");
        order.verify(service).remember(captor.capture());
        order.verify(manager).commit(transactionStatus);
        assertThat(captor.getValue().getUsername()).isEqualTo(USER_ID.toString());
        assertThat(captor.getValue().getResponseBody()).contains("expense-1");
        assertThat(response.getContentAsString()).contains("expense-1");
    }

    @Test
    void shouldReplayPreviouslyCompletedMutation() throws Exception {
        var response = new MockHttpServletResponse();
        when(service.find(USER_ID.toString(), "operation-1")).thenReturn(Optional.of(record("POST")));
        filter.doFilter(request("operation-1"), response, forbiddenChain());

        assertThat(response.getStatus()).isEqualTo(201);
        assertThat(response.getHeader("X-Idempotent-Replay")).isEqualTo("true");
        assertThat(response.getContentAsString()).contains("expense-1");
        verify(service, never()).remember(any());
    }

    @Test
    void shouldRejectKeyReuseForAnotherMethod() throws Exception {
        var response = new MockHttpServletResponse();
        when(service.find(USER_ID.toString(), "operation-1")).thenReturn(Optional.of(record("PUT")));
        filter.doFilter(request("operation-1"), response, forbiddenChain());
        assertThat(response.getStatus()).isEqualTo(409);
        verify(service, never()).remember(any());
    }

    @Test
    void shouldNotSilentlyBypassProtectionForOversizedKey() throws Exception {
        var response = new MockHttpServletResponse();
        filter.doFilter(request("x".repeat(101)), response, forbiddenChain());
        assertThat(response.getStatus()).isEqualTo(400);
        verifyNoInteractions(service);
    }

    @Test
    void shouldNotTrustBearerSubjectWithoutAuthenticatedUuid() throws Exception {
        SecurityContextHolder.clearContext();
        var request = request("operation-1");
        request.addHeader("Authorization", "Bearer unverified-token");
        filter.doFilter(request, new MockHttpServletResponse(), successChain());
        verifyNoInteractions(service);
    }

    @Test
    void shouldIgnoreRequestsWithoutKey() throws Exception {
        filter.doFilter(new MockHttpServletRequest("POST", "/api/v1/expenses"),
                new MockHttpServletResponse(), successChain());
        verifyNoInteractions(service);
    }

    @Test
    void shouldDiscardSuccessResponseAndPropagateReceiptFailure() {
        doThrow(new IllegalStateException("receipt unavailable")).when(service).remember(any());
        var response = new MockHttpServletResponse();

        assertThatThrownBy(() -> filter.doFilter(request("operation-1"), response, successChain()))
                .isInstanceOf(IllegalStateException.class);

        verify(manager).rollback(transactionStatus);
        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getContentAsByteArray()).isEmpty();
    }

    @Test
    void shouldMarkHandledErrorResponseForRollback() throws Exception {
        var response = new MockHttpServletResponse();
        filter.doFilter(request("operation-1"), response, (request, wrapped) -> {
            ((HttpServletResponse) wrapped).setStatus(422);
            wrapped.getWriter().write("validation failed");
        });

        assertThat(transactionStatus.isRollbackOnly()).isTrue();
        assertThat(response.getStatus()).isEqualTo(422);
        assertThat(response.getContentAsString()).isEqualTo("validation failed");
        verify(service, never()).remember(any());
    }

    private MockHttpServletRequest request(String key) {
        var request = new MockHttpServletRequest("POST", "/api/v1/expenses");
        request.addHeader(IdempotencyFilter.IDEMPOTENCY_HEADER, key);
        return request;
    }

    private IdempotencyRecord record(String method) {
        return new IdempotencyRecord(USER_ID.toString(), "operation-1", method,
                "/api/v1/expenses", 201, "application/json", "{\"id\":\"expense-1\"}");
    }

    private FilterChain successChain() {
        return (request, response) -> {
            ((HttpServletResponse) response).setStatus(201);
            response.setContentType("application/json");
            response.getWriter().write("{\"id\":\"expense-1\"}");
        };
    }

    private FilterChain forbiddenChain() {
        return (request, response) -> { throw new AssertionError("Mutation must not run"); };
    }
}
