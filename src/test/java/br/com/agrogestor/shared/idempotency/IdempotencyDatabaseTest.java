package br.com.agrogestor.shared.idempotency;

import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.entity.UsuarioRole;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.auth.security.JwtAuthenticationFilter;
import br.com.agrogestor.auth.security.JwtTokenService;
import br.com.agrogestor.expense.dto.ExpenseRequest;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.expense.service.ExpenseService;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.repository.PropertyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** All writes/rollbacks/locks below use an isolated real H2 database, not mocked repositories. */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:idempotency;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.open-in-view=false",
        "agrogestor.security.jwt-secret=test-secret-with-at-least-32-characters",
        "agrogestor.security.cors-allowed-origins=http://localhost:5173",
        "agrogestor.security.bootstrap-admin.enabled=false",
        "agrogestor.idempotency.cleanup-cron=-"
})
@AutoConfigureMockMvc
class IdempotencyDatabaseTest {

    @Autowired private IdempotencyFilter filter;
    @Autowired private IdempotencyService service;
    @Autowired private IdempotencyRecordRepository receipts;
    @Autowired private ExpenseService expenses;
    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private UsuarioRepository users;
    @Autowired private PropertyRepository properties;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private MockMvc mvc;
    @Autowired private JwtTokenService tokens;
    @Autowired private SecurityFilterChain securityFilterChain;
    @Autowired private FilterRegistrationBean<IdempotencyFilter> idempotencyFilterRegistration;
    private Usuario user;

    @BeforeEach
    void setUp() {
        jdbc.execute("ALTER TABLE idempotency_records DROP CONSTRAINT IF EXISTS reject_test_receipt");
        receipts.deleteAll();
        expenseRepository.deleteAll();
        users.deleteAll();
        properties.deleteAll();
        var property = properties.saveAndFlush(new Property("Isolated idempotency test"));
        user = users.saveAndFlush(new Usuario(property, "Test", "before@example.test", "unused", UsuarioRole.USER));
        authenticate();
    }

    @AfterEach
    void cleanUp() {
        SecurityContextHolder.clearContext();
        jdbc.execute("ALTER TABLE idempotency_records DROP CONSTRAINT IF EXISTS reject_test_receipt");
    }

    @Test
    void shouldRollbackActualExpenseWhenReceiptInsertFailsAndAllowSafeRetry() throws Exception {
        jdbc.execute("ALTER TABLE idempotency_records ADD CONSTRAINT reject_test_receipt "
                + "CHECK (request_key <> 'receipt-failure')");
        var response = new MockHttpServletResponse();

        assertThatThrownBy(() -> filter.doFilter(request("receipt-failure"), response, createExpense()))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);

        assertThat(expenseRepository.count()).isZero();
        assertThat(receipts.count()).isZero();
        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getContentAsByteArray()).isEmpty();

        jdbc.execute("ALTER TABLE idempotency_records DROP CONSTRAINT reject_test_receipt");
        var success = new MockHttpServletResponse();
        filter.doFilter(request("receipt-failure"), success, createExpense());
        var replay = new MockHttpServletResponse();
        filter.doFilter(request("receipt-failure"), replay, forbiddenChain());

        assertThat(success.getStatus()).isEqualTo(201);
        assertThat(replay.getContentAsString()).isEqualTo(success.getContentAsString());
        assertThat(replay.getHeader("X-Idempotent-Replay")).isEqualTo("true");
        assertThat(expenseRepository.count()).isEqualTo(1);
        assertThat(receipts.count()).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(ints = {302, 409, 422, 500})
    void shouldRollbackActualExpenseForHandledNonSuccessResponse(int status) throws Exception {
        var response = new MockHttpServletResponse();
        filter.doFilter(request("handled-error"), response, (request, wrapped) -> {
            expenses.create(expenseRequest());
            ((HttpServletResponse) wrapped).sendError(status, "Handled failure");
        });
        assertThat(response.getStatus()).isEqualTo(status);
        assertThat(expenseRepository.count()).isZero();
        assertThat(receipts.count()).isZero();

        filter.doFilter(request("handled-error"), new MockHttpServletResponse(), createExpense());
        assertThat(expenseRepository.count()).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"io", "servlet", "runtime"})
    void shouldRollbackActualExpenseAndNeverPublishPartialSuccessWhenChainThrows(String kind) {
        var response = new MockHttpServletResponse();
        assertThatThrownBy(() -> filter.doFilter(request("chain-error"), response, (request, wrapped) -> {
            expenses.create(expenseRequest());
            ((HttpServletResponse) wrapped).setStatus(201);
            wrapped.getWriter().write("uncommitted success");
            wrapped.flushBuffer();
            switch (kind) {
                case "io" -> throw new IOException("test failure");
                case "servlet" -> throw new ServletException("test failure");
                default -> throw new IllegalStateException("test failure");
            }
        })).hasMessageContaining("test failure");

        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getContentAsByteArray()).isEmpty();
        assertThat(expenseRepository.count()).isZero();
        assertThat(receipts.count()).isZero();
    }

    @Test
    void shouldSerializeTwoIndependentFiltersUsingTheDatabaseLock() throws Exception {
        var firstFilter = new IdempotencyFilter(service, transactionManager);
        var secondFilter = new IdempotencyFilter(service, transactionManager);
        var firstEntered = new CountDownLatch(1);
        var releaseFirst = new CountDownLatch(1);
        var secondStarted = new CountDownLatch(1);
        var executed = new AtomicInteger();
        FilterChain chain = (request, response) -> {
            executed.incrementAndGet();
            createExpense().doFilter(request, response);
            firstEntered.countDown();
            try {
                if (!releaseFirst.await(5, TimeUnit.SECONDS)) {
                    throw new ServletException("Timed out waiting for concurrent request");
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new ServletException(exception);
            }
        };
        var firstResponse = new MockHttpServletResponse();
        var secondResponse = new MockHttpServletResponse();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> {
                try {
                    authenticate();
                    firstFilter.doFilter(request("concurrent"), firstResponse, chain);
                    return null;
                } finally {
                    SecurityContextHolder.clearContext();
                }
            });
            try {
                assertThat(firstEntered.await(5, TimeUnit.SECONDS)).isTrue();
                var second = executor.submit(() -> {
                    try {
                        authenticate();
                        secondStarted.countDown();
                        secondFilter.doFilter(request("concurrent"), secondResponse, chain);
                        return null;
                    } finally {
                        SecurityContextHolder.clearContext();
                    }
                });
                assertThat(secondStarted.await(5, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() -> second.get(200, TimeUnit.MILLISECONDS))
                        .isInstanceOf(TimeoutException.class);
                assertThat(executed).hasValue(1);
                releaseFirst.countDown();
                first.get(5, TimeUnit.SECONDS);
                second.get(5, TimeUnit.SECONDS);
            } finally {
                releaseFirst.countDown();
            }
        }
        assertThat(executed).hasValue(1);
        assertThat(expenseRepository.count()).isEqualTo(1);
        assertThat(receipts.count()).isEqualTo(1);
        assertThat(secondResponse.getHeader("X-Idempotent-Replay")).isEqualTo("true");
        assertThat(secondResponse.getContentAsString()).isEqualTo(firstResponse.getContentAsString());
    }

    @Test
    void shouldAuthenticateBeforeIdempotencyAndReplayAfterEmailChange() throws Exception {
        SecurityContextHolder.clearContext();
        assertThat(idempotencyFilterRegistration.isEnabled()).isFalse();
        var chain = securityFilterChain.getFilters();
        assertThat(chain.indexOf(filter)).isGreaterThan(chain.stream()
                .filter(JwtAuthenticationFilter.class::isInstance).mapToInt(chain::indexOf).findFirst().orElseThrow());

        String originalToken = tokens.generate(user);
        var first = mvc.perform(post("/api/v1/expenses")
                        .header("Authorization", "Bearer " + originalToken)
                        .header(IdempotencyFilter.IDEMPOTENCY_HEADER, "email-change")
                        .contentType("application/json").content(expenseJson()))
                .andExpect(status().isCreated()).andReturn().getResponse();
        user.atualizarDados("Test", "after@example.test", UsuarioRole.USER);
        user = users.saveAndFlush(user);

        var replay = mvc.perform(post("/api/v1/expenses")
                        .header("Authorization", "Bearer " + tokens.generate(user))
                        .header(IdempotencyFilter.IDEMPOTENCY_HEADER, "email-change")
                        .contentType("application/json").content(expenseJson()))
                .andExpect(status().isCreated()).andReturn().getResponse();

        assertThat(replay.getHeader("X-Idempotent-Replay")).isEqualTo("true");
        assertThat(replay.getContentAsString()).isEqualTo(first.getContentAsString());
        assertThat(expenseRepository.count()).isEqualTo(1);
        assertThat(receipts.findAll()).singleElement().extracting(IdempotencyRecord::getUsername)
                .isEqualTo(user.getId().toString());
    }

    @Test
    void shouldRejectReceiptWritesOutsideTheBusinessTransaction() {
        assertThatThrownBy(() -> service.remember(receipt(user.getId().toString(), "standalone")))
                .isInstanceOf(IllegalTransactionStateException.class);
        assertThat(receipts.count()).isZero();
    }

    @Test
    void shouldMigrateOnlyUnambiguousLegacyReceiptsWithoutDeletingHistory() {
        receipts.saveAndFlush(receipt(user.getEmail(), "legacy"));
        receipts.saveAndFlush(receipt("unmatched@example.test", "unmatched"));
        receipts.saveAndFlush(receipt(user.getEmail(), "collision"));
        receipts.saveAndFlush(receipt(user.getId().toString(), "collision"));

        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V32__use_stable_identity_for_idempotency.sql"))
                .execute(jdbc.getDataSource());

        assertThat(receipts.count()).isEqualTo(4);
        assertThat(receipts.findByUsernameAndRequestKey(user.getId().toString(), "legacy")).isPresent();
        assertThat(receipts.findByUsernameAndRequestKey("unmatched@example.test", "unmatched")).isPresent();
        assertThat(receipts.findByUsernameAndRequestKey(user.getEmail(), "collision")).isPresent();
        assertThat(receipts.findByUsernameAndRequestKey(user.getId().toString(), "collision")).isPresent();
    }

    @Test
    void shouldNotAssignHistoricalReceiptToAnAccountChangedAfterItWasRecorded() throws Exception {
        receipts.saveAndFlush(receipt(user.getEmail(), "old-email"));
        jdbc.update("UPDATE usuarios SET updated_at = ? WHERE id = ?",
                java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC).plusMinutes(1), user.getId());

        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V32__use_stable_identity_for_idempotency.sql"))
                .execute(jdbc.getDataSource());

        assertThat(receipts.findByUsernameAndRequestKey(user.getEmail(), "old-email")).isPresent();
        assertThat(receipts.findByUsernameAndRequestKey(user.getId().toString(), "old-email")).isEmpty();

        var response = new MockHttpServletResponse();
        filter.doFilter(request("old-email"), response, forbiddenChain());
        assertThat(response.getStatus()).isEqualTo(409);
        assertThat(response.getContentAsString()).contains("conferência")
                .doesNotContain("historical-expense");
        assertThat(expenseRepository.count()).isZero();
        assertThat(receipts.count()).isEqualTo(1);
    }

    @Test
    void shouldBlockUnmappedLegacyKeyWithoutReplayingOrDuplicatingItsData() throws Exception {
        receipts.saveAndFlush(receipt("previous-owner@example.test", "unmapped"));
        var response = new MockHttpServletResponse();

        filter.doFilter(request("unmapped"), response, forbiddenChain());

        assertThat(response.getStatus()).isEqualTo(409);
        assertThat(response.getContentAsString()).doesNotContain("historical-expense");
        assertThat(expenseRepository.count()).isZero();
        assertThat(receipts.count()).isEqualTo(1);
    }

    private void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(user.getId().toString(), null, List.of()));
    }

    private MockHttpServletRequest request(String key) {
        var request = new MockHttpServletRequest("POST", "/api/v1/expenses");
        request.addHeader(IdempotencyFilter.IDEMPOTENCY_HEADER, key);
        return request;
    }

    private ExpenseRequest expenseRequest() {
        return new ExpenseRequest(null, "Isolated expense", ExpenseCategory.OTHER,
                new BigDecimal("17.50"), LocalDate.of(2026, 9, 12), null);
    }

    private String expenseJson() {
        return "{\"description\":\"Isolated expense\",\"category\":\"OTHER\","
                + "\"amount\":17.50,\"expenseDate\":\"2026-09-12\"}";
    }

    private FilterChain createExpense() {
        return (request, response) -> {
            var expense = expenses.create(expenseRequest());
            ((HttpServletResponse) response).setStatus(201);
            response.setContentType("application/json");
            response.getWriter().write("{\"id\":\"" + expense.id() + "\"}");
        };
    }

    private FilterChain forbiddenChain() {
        return (request, response) -> { throw new AssertionError("Mutation must not run"); };
    }

    private IdempotencyRecord receipt(String identity, String key) {
        return new IdempotencyRecord(identity, key, "POST", "/api/v1/expenses", 201,
                "application/json", "{\"id\":\"historical-expense\"}");
    }
}
