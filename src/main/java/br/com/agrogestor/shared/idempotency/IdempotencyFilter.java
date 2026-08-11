package br.com.agrogestor.shared.idempotency;

import br.com.agrogestor.auth.security.JwtTokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

@Component
public class IdempotencyFilter extends OncePerRequestFilter {

    public static final String IDEMPOTENCY_HEADER = "X-Idempotency-Key";
    private static final String REPLAY_HEADER = "X-Idempotent-Replay";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final Set<String> MUTATING_METHODS = Set.of(
            "POST", "PUT", "PATCH", "DELETE"
    );
    private static final int LOCK_STRIPES = 64;
    private static final Logger LOGGER = LoggerFactory.getLogger(IdempotencyFilter.class);

    private final IdempotencyService service;
    private final JwtTokenService tokenService;
    private final Lock[] requestLocks = new Lock[LOCK_STRIPES];

    public IdempotencyFilter(
            IdempotencyService service,
            JwtTokenService tokenService
    ) {
        this.service = service;
        this.tokenService = tokenService;
        for (int index = 0; index < requestLocks.length; index++) {
            requestLocks[index] = new ReentrantLock();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String requestKey = request.getHeader(IDEMPOTENCY_HEADER);
        return !MUTATING_METHODS.contains(request.getMethod())
                || requestKey == null
                || requestKey.isBlank()
                || request.getRequestURI().equals("/api/v1/auth/login");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String username = authenticatedUsername(request);
        String requestKey = request.getHeader(IDEMPOTENCY_HEADER);
        if (username == null || requestKey.length() > 100) {
            filterChain.doFilter(request, response);
            return;
        }

        Lock requestLock = lockFor(username, requestKey);
        requestLock.lock();
        try {
            var previous = service.find(username, requestKey);
            if (previous.isPresent()) {
                replay(previous.get(), request, response);
                return;
            }

            var cachedResponse = new ContentCachingResponseWrapper(response);
            try {
                filterChain.doFilter(request, cachedResponse);
                if (cachedResponse.getStatus() >= 200 && cachedResponse.getStatus() < 300) {
                    remember(username, requestKey, request, cachedResponse);
                }
            } finally {
                cachedResponse.copyBodyToResponse();
            }
        } finally {
            requestLock.unlock();
        }
    }

    private Lock lockFor(String username, String requestKey) {
        int index = Math.floorMod((username + '\0' + requestKey).hashCode(), LOCK_STRIPES);
        return requestLocks[index];
    }

    private String authenticatedUsername(HttpServletRequest request) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            return null;
        }
        try {
            return tokenService.decode(
                    authorization.substring(BEARER_PREFIX.length())
            ).getSubject();
        } catch (JwtException exception) {
            return null;
        }
    }

    private void replay(
            IdempotencyRecord record,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        if (!record.getRequestMethod().equals(request.getMethod())
                || !record.getRequestPath().equals(request.getRequestURI())) {
            response.sendError(
                    HttpServletResponse.SC_CONFLICT,
                    "A identificação da operação já foi utilizada em outro lançamento"
            );
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

    private void remember(
            String username,
            String requestKey,
            HttpServletRequest request,
            ContentCachingResponseWrapper response
    ) {
        String body = new String(response.getContentAsByteArray(), StandardCharsets.UTF_8);
        try {
            service.remember(new IdempotencyRecord(
                    username,
                    requestKey,
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    response.getContentType(),
                    body.isEmpty() ? null : body
            ));
        } catch (RuntimeException exception) {
            LOGGER.warn("Não foi possível registrar a operação idempotente", exception);
        }
    }
}
