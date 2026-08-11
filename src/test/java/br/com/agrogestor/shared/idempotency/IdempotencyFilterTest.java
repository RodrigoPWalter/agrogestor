package br.com.agrogestor.shared.idempotency;

import br.com.agrogestor.auth.security.JwtTokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdempotencyFilterTest {

    @Mock
    private IdempotencyService service;

    @Mock
    private JwtTokenService tokenService;

    @Mock
    private Jwt jwt;

    private IdempotencyFilter filter;

    @BeforeEach
    void setUp() {
        filter = new IdempotencyFilter(service, tokenService);
    }

    @Test
    void shouldRememberSuccessfulMutation() throws Exception {
        var request = authenticatedRequest("operacao-1", "/api/v1/expenses");
        var response = new MockHttpServletResponse();
        when(service.find("produtor@agro.local", "operacao-1"))
                .thenReturn(Optional.empty());

        FilterChain chain = (currentRequest, currentResponse) -> {
            var httpResponse = (HttpServletResponse) currentResponse;
            httpResponse.setStatus(201);
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"id\":\"gasto-1\"}");
        };

        filter.doFilter(request, response, chain);

        var captor = ArgumentCaptor.forClass(IdempotencyRecord.class);
        verify(service).remember(captor.capture());
        assertThat(captor.getValue().getUsername()).isEqualTo("produtor@agro.local");
        assertThat(captor.getValue().getRequestKey()).isEqualTo("operacao-1");
        assertThat(captor.getValue().getResponseStatus()).isEqualTo(201);
        assertThat(captor.getValue().getResponseBody()).contains("gasto-1");
        assertThat(response.getContentAsString()).contains("gasto-1");
    }

    @Test
    void shouldReplayPreviouslyCompletedMutation() throws Exception {
        var request = authenticatedRequest("operacao-1", "/api/v1/expenses");
        var response = new MockHttpServletResponse();
        var record = new IdempotencyRecord(
                "produtor@agro.local",
                "operacao-1",
                "POST",
                "/api/v1/expenses",
                201,
                "application/json",
                "{\"id\":\"gasto-1\"}"
        );
        when(service.find("produtor@agro.local", "operacao-1"))
                .thenReturn(Optional.of(record));
        FilterChain chain = (currentRequest, currentResponse) -> {
            throw new AssertionError("A operação não deveria ser executada novamente");
        };

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(201);
        assertThat(response.getHeader("X-Idempotent-Replay")).isEqualTo("true");
        assertThat(response.getContentAsString()).contains("gasto-1");
        verify(service, never()).remember(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void shouldIgnoreRequestWithoutIdempotencyKey() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/v1/expenses");
        var response = new MockHttpServletResponse();
        FilterChain chain = (currentRequest, currentResponse) ->
                ((HttpServletResponse) currentResponse).setStatus(204);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(204);
        verify(service, never()).find(anyString(), anyString());
    }

    @Test
    void shouldSerializeConcurrentRequestsWithTheSameKey() throws Exception {
        var storedRecord = new AtomicReference<IdempotencyRecord>();
        var chainExecutions = new AtomicInteger();
        var firstRequestEntered = new CountDownLatch(1);
        var releaseFirstRequest = new CountDownLatch(1);
        when(service.find("produtor@agro.local", "operacao-simultanea"))
                .thenAnswer(ignored -> Optional.ofNullable(storedRecord.get()));
        doAnswer(invocation -> {
            storedRecord.set(invocation.getArgument(0));
            return null;
        }).when(service).remember(org.mockito.ArgumentMatchers.any());

        FilterChain chain = (currentRequest, currentResponse) -> {
            chainExecutions.incrementAndGet();
            firstRequestEntered.countDown();
            try {
                if (!releaseFirstRequest.await(2, TimeUnit.SECONDS)) {
                    throw new ServletException("Tempo excedido no teste concorrente");
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new ServletException(exception);
            }
            var httpResponse = (HttpServletResponse) currentResponse;
            httpResponse.setStatus(201);
            httpResponse.getWriter().write("{\"id\":\"gasto-1\"}");
        };
        var firstRequest = authenticatedRequest(
                "operacao-simultanea",
                "/api/v1/expenses"
        );
        var secondRequest = authenticatedRequest(
                "operacao-simultanea",
                "/api/v1/expenses"
        );
        var firstResponse = new MockHttpServletResponse();
        var secondResponse = new MockHttpServletResponse();

        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> {
                filter.doFilter(firstRequest, firstResponse, chain);
                return null;
            });
            assertThat(firstRequestEntered.await(2, TimeUnit.SECONDS)).isTrue();
            var secondStarted = new CountDownLatch(1);
            var second = executor.submit(() -> {
                secondStarted.countDown();
                filter.doFilter(
                        secondRequest,
                        secondResponse,
                        chain
                );
                return null;
            });
            assertThat(secondStarted.await(2, TimeUnit.SECONDS)).isTrue();

            releaseFirstRequest.countDown();
            first.get(2, TimeUnit.SECONDS);
            second.get(2, TimeUnit.SECONDS);
        }

        assertThat(chainExecutions).hasValue(1);
        assertThat(secondResponse.getHeader("X-Idempotent-Replay")).isEqualTo("true");
        assertThat(secondResponse.getContentAsString()).contains("gasto-1");
    }

    private MockHttpServletRequest authenticatedRequest(String key, String path) {
        var request = new MockHttpServletRequest("POST", path);
        request.addHeader(IdempotencyFilter.IDEMPOTENCY_HEADER, key);
        request.addHeader("Authorization", "Bearer jwt-assinado");
        when(tokenService.decode("jwt-assinado")).thenReturn(jwt);
        when(jwt.getSubject()).thenReturn("produtor@agro.local");
        return request;
    }
}
