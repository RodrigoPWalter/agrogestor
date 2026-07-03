package br.com.agrogestor.auth.security;

import br.com.agrogestor.auth.entity.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class JwtTokenService {

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final Duration expiration;
    private final String issuer;

    public JwtTokenService(
            JwtEncoder encoder,
            JwtDecoder decoder,
            @Value("${agrogestor.security.jwt-expiration-minutes}") long expirationMinutes,
            @Value("${agrogestor.security.jwt-issuer}") String issuer
    ) {
        this.encoder = encoder;
        this.decoder = decoder;
        this.expiration = Duration.ofMinutes(expirationMinutes);
        this.issuer = issuer;
    }

    public String generate(Usuario usuario) {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plus(expiration))
                .subject(usuario.getEmail())
                .claim("uid", usuario.getId().toString())
                .claim("name", usuario.getNome())
                .claim("role", usuario.getRole().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public Jwt decode(String token) {
        return decoder.decode(token);
    }

    public long expiresInSeconds() {
        return expiration.toSeconds();
    }
}
