package br.com.agrogestor.auth.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
                "Authorization", "Content-Type", "X-Idempotency-Key", "X-Request-Id"
        );
        assertThat(cors.getExposedHeaders()).contains(
                "X-Idempotent-Replay", "X-Request-Id");
    }

    @Test
    void shouldRejectATokenIssuedByAnotherApplication() {
        byte[] bytes = "test-secret-with-at-least-32-characters"
                .getBytes(StandardCharsets.UTF_8);
        var key = new SecretKeySpec(bytes, "HmacSHA256");
        var encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder()
                .issuer("https://outro-sistema.test")
                .subject("usuario@teste.local")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(600))
                .build();
        String token = encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();

        var decoder = config.jwtDecoder(key, "https://agrogestor.test");

        assertThatThrownBy(() -> decoder.decode(token))
                .isInstanceOf(JwtException.class);
    }
}
