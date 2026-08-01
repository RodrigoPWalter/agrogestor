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
        AttemptWindow window = attemptsByAddress.compute(
                request.getRemoteAddr(),
                (address, current) -> current == null || current.expiredAt().isBefore(now)
                        ? new AttemptWindow(1, now.plus(windowDuration))
                        : current.incremented()
        );

        if (window.attempts() <= maximumAttempts) {
            filterChain.doFilter(request, response);
            return;
        }

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
