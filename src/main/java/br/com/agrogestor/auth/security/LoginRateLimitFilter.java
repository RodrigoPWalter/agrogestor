package br.com.agrogestor.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/api/v1/auth/login";

    private final Map<String, AttemptWindow> attemptsByAddress = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final int maximumAttempts;
    private final Duration windowDuration;
    private final Clock clock;

    @Autowired
    public LoginRateLimitFilter(
            ObjectMapper objectMapper,
            @Value("${agrogestor.security.login-rate-limit.max-attempts:10}")
            int maximumAttempts,
            @Value("${agrogestor.security.login-rate-limit.window-minutes:15}")
            long windowMinutes
    ) {
        this(objectMapper, maximumAttempts, Duration.ofMinutes(windowMinutes), Clock.systemUTC());
    }

    LoginRateLimitFilter(
            ObjectMapper objectMapper,
            int maximumAttempts,
            Duration windowDuration,
            Clock clock
    ) {
        this.objectMapper = objectMapper;
        this.maximumAttempts = maximumAttempts;
        this.windowDuration = windowDuration;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !LOGIN_PATH.equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Instant now = clock.instant();
        String remoteAddress = request.getRemoteAddr();
        AttemptWindow window = activeWindow(remoteAddress, now);

        if (window != null && window.attempts() >= maximumAttempts) {
            writeRateLimitResponse(response, now, window);
            return;
        }

        filterChain.doFilter(request, response);
        if (response.getStatus() == HttpStatus.UNAUTHORIZED.value()) {
            registerFailure(remoteAddress, now);
        } else if (response.getStatus() >= 200 && response.getStatus() < 300) {
            attemptsByAddress.remove(remoteAddress);
        }
    }

    private AttemptWindow activeWindow(String remoteAddress, Instant now) {
        AttemptWindow current = attemptsByAddress.get(remoteAddress);
        if (current != null && !current.expiredAt().isAfter(now)) {
            attemptsByAddress.remove(remoteAddress, current);
            return null;
        }
        return current;
    }

    private void registerFailure(String remoteAddress, Instant now) {
        attemptsByAddress.compute(
                remoteAddress,
                (address, current) -> current == null || !current.expiredAt().isAfter(now)
                        ? new AttemptWindow(1, now.plus(windowDuration))
                        : current.incremented()
        );
    }

    private void writeRateLimitResponse(
            HttpServletResponse response,
            Instant now,
            AttemptWindow window
    ) throws IOException {
        long retryAfter = Math.max(1, Duration.between(now, window.expiredAt()).toSeconds());
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(retryAfter));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), Map.of(
                "message",
                "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente."
        ));
    }

    private record AttemptWindow(int attempts, Instant expiredAt) {
        AttemptWindow incremented() {
            return new AttemptWindow(attempts + 1, expiredAt);
        }
    }
}
