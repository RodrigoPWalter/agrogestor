package br.com.agrogestor.auth.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigTest {

    private final SecurityConfig config = new SecurityConfig();

    @Test
    void shouldConfigureAllowedOriginsForApi() {
        var source = config.corsConfigurationSource(
                "https://agrogestor.example, https://preview.example"
        );
        var request = new MockHttpServletRequest("OPTIONS", "/api/v1/auth/login");

        var cors = source.getCorsConfiguration(request);

        assertThat(cors).isNotNull();
        assertThat(cors.getAllowedOrigins()).containsExactly(
                "https://agrogestor.example",
                "https://preview.example"
        );
        assertThat(cors.getAllowedMethods()).contains("GET", "POST", "OPTIONS");
        assertThat(cors.getAllowedHeaders()).contains(
                "Authorization", "Content-Type"
        );
    }
}
