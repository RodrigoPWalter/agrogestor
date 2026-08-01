package br.com.agrogestor.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimitFilterTest {

    private final LoginRateLimitFilter filter = new LoginRateLimitFilter(
            new ObjectMapper(),
            2,
            Duration.ofMinutes(15),
            Clock.fixed(Instant.parse("2026-08-01T12:00:00Z"), ZoneOffset.UTC)
    );

    @Test
    void shouldBlockRepeatedLoginAttemptsFromTheSameAddress() throws Exception {
        assertThat(loginAttempt().getStatus()).isEqualTo(200);
        assertThat(loginAttempt().getStatus()).isEqualTo(200);

        MockHttpServletResponse blocked = loginAttempt();

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isEqualTo("900");
        assertThat(blocked.getContentAsString())
                .contains("Muitas tentativas de acesso");
    }

    @Test
    void shouldNotLimitOtherEndpoints() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/v1/health");
        request.setRemoteAddr("192.0.2.20");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
    }

    private MockHttpServletResponse loginAttempt() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("192.0.2.10");
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
