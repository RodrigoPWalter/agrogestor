package br.com.agrogestor.shared.idempotency;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;

@Component
public class IdempotencyFilter extends OncePerRequestFilter {

    public static final String IDEMPOTENCY_HEADER = "X-Idempotency-Key";
    private static final String REPLAY_HEADER = "X-Idempotent-Replay";
    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final IdempotencyService service;
    private final TransactionTemplate transaction;

    public IdempotencyFilter(IdempotencyService service, PlatformTransactionManager transactionManager) {
        this.service = service;
        this.transaction = new TransactionTemplate(transactionManager);
        // Após aguardar o bloqueio, a consulta precisa enxergar o registro já confirmado.
        this.transaction.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String requestKey = request.getHeader(IDEMPOTENCY_HEADER);
        return !MUTATING_METHODS.contains(request.getMethod())
                || requestKey == null || requestKey.isBlank()
                || request.getRequestURI().equals("/api/v1/auth/login");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        UUID userId = authenticatedUserId();
        if (userId == null) {
            filterChain.doFilter(request, response);
            return;
        }
        String requestKey = request.getHeader(IDEMPOTENCY_HEADER);
        if (requestKey.length() > 100) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Identificação da operação muito longa");
            return;
        }

        var cachedResponse = new BufferedResponse(response);
        try {
            transaction.executeWithoutResult(status -> {
                // O bloqueio no banco também protege requisições em instâncias diferentes.
                service.lockUser(userId);
                var previous = service.find(userId.toString(), requestKey);
                try {
                    if (previous.isPresent()) {
                        replay(previous.get(), request, cachedResponse);
                        return;
                    }
                    if (service.hasLegacyReceipt(requestKey)) {
                        cachedResponse.setStatus(HttpServletResponse.SC_CONFLICT);
                        cachedResponse.setContentType("application/json");
                        cachedResponse.setCharacterEncoding(StandardCharsets.UTF_8.name());
                        cachedResponse.getWriter().write(
                                "{\"message\":\"Este lançamento antigo precisa de conferência no histórico antes de reenviar. Nenhum dado foi alterado.\"}");
                        return;
                    }
                    filterChain.doFilter(request, cachedResponse);
                    if (cachedResponse.getStatus() >= 200 && cachedResponse.getStatus() < 300) {
                        String body = new String(cachedResponse.getContentAsByteArray(), StandardCharsets.UTF_8);
                        service.remember(new IdempotencyRecord(
                                userId.toString(), requestKey, request.getMethod(), request.getRequestURI(),
                                cachedResponse.getStatus(), cachedResponse.getContentType(),
                                body.isEmpty() ? null : body));
                    } else {
                        // O controller pode ter tratado a exceção e retornado uma resposta de erro.
                        status.setRollbackOnly();
                    }
                } catch (ServletException | IOException exception) {
                    throw new FilterChainFailure(exception);
                }
            });
        } catch (FilterChainFailure failure) {
            discardUncommittedResponse(response);
            if (failure.getCause() instanceof IOException exception) {
                throw exception;
            }
            throw (ServletException) failure.getCause();
        } catch (RuntimeException | Error failure) {
            discardUncommittedResponse(response);
            throw failure;
        }
        // A resposta de sucesso só é liberada após confirmar a operação e seu registro.
        cachedResponse.copyBodyToResponse();
    }

    private UUID authenticatedUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private void discardUncommittedResponse(HttpServletResponse response) {
        response.resetBuffer();
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        response.setHeader("Location", null);
        response.setHeader(REPLAY_HEADER, null);
    }

    private void replay(IdempotencyRecord record, HttpServletRequest request,
                        HttpServletResponse response) throws IOException {
        if (!record.getRequestMethod().equals(request.getMethod())
                || !record.getRequestPath().equals(request.getRequestURI())) {
            response.sendError(HttpServletResponse.SC_CONFLICT,
                    "A identificação da operação já foi utilizada em outro lançamento");
            return;
        }
        response.setStatus(record.getResponseStatus());
        response.setHeader(REPLAY_HEADER, "true");
        if (record.getResponseContentType() != null) {
            response.setContentType(record.getResponseContentType());
        }
        if (record.getResponseBody() != null) {
            response.getWriter().write(record.getResponseBody());
        }
    }

    private static final class FilterChainFailure extends RuntimeException {
        private FilterChainFailure(Exception cause) {
            super(cause);
        }
    }

    /** Impede sendError/sendRedirect de liberar a resposta antes do fim da transação. */
    private static final class BufferedResponse extends ContentCachingResponseWrapper {
        private BufferedResponse(HttpServletResponse response) {
            super(response);
        }

        @Override
        public void sendError(int status) {
            resetBuffer();
            setStatus(status);
        }

        @Override
        public void sendError(int status, String message) {
            sendError(status);
        }

        @Override
        public void sendRedirect(String location) {
            resetBuffer();
            setStatus(HttpServletResponse.SC_FOUND);
            setHeader("Location", location);
        }
    }
}
