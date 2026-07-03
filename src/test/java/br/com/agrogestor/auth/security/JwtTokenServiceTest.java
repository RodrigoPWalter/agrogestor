package br.com.agrogestor.auth.security;

import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.entity.UsuarioRole;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenServiceTest {

    private JwtTokenService service;

    @BeforeEach
    void setUp() {
        byte[] bytes = "test-secret-with-at-least-32-characters".getBytes(StandardCharsets.UTF_8);
        var key = new SecretKeySpec(bytes, "HmacSHA256");
        service = new JwtTokenService(
                new NimbusJwtEncoder(new ImmutableSecret<>(key)),
                NimbusJwtDecoder.withSecretKey(key)
                        .macAlgorithm(MacAlgorithm.HS256)
                        .build(),
                60,
                "https://agrogestor.test"
        );
    }

    @Test
    void shouldGenerateSignedTokenWithUserClaims() {
        Usuario usuario = usuario();

        var jwt = service.decode(service.generate(usuario));

        assertThat(jwt.getSubject()).isEqualTo(usuario.getEmail());
        assertThat(jwt.getClaimAsString("uid")).isEqualTo(usuario.getId().toString());
        assertThat(jwt.getClaimAsString("role")).isEqualTo("ADMIN");
        assertThat(jwt.getIssuer().toString()).isEqualTo("https://agrogestor.test");
        assertThat(service.expiresInSeconds()).isEqualTo(3600);
    }

    @Test
    void shouldRejectInvalidToken() {
        assertThatThrownBy(() -> service.decode("token-invalido"))
                .isInstanceOf(JwtException.class);
    }

    private Usuario usuario() {
        Usuario usuario = new Usuario(
                "Administrador",
                "admin@agrogestor.local",
                "hash",
                UsuarioRole.ADMIN
        );
        ReflectionTestUtils.setField(usuario, "id", UUID.randomUUID());
        return usuario;
    }
}
