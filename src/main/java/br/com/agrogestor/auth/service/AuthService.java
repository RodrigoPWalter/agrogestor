package br.com.agrogestor.auth.service;

import br.com.agrogestor.auth.dto.AuthenticatedUserResponse;
import br.com.agrogestor.auth.dto.LoginRequest;
import br.com.agrogestor.auth.dto.LoginResponse;
import br.com.agrogestor.auth.exception.InvalidCredentialsException;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.auth.security.JwtTokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository repository;
    private final JwtTokenService tokenService;

    public AuthService(
            AuthenticationManager authenticationManager,
            UsuarioRepository repository,
            JwtTokenService tokenService
    ) {
        this.authenticationManager = authenticationManager;
        this.repository = repository;
        this.tokenService = tokenService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        try {
            authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            email,
                            request.password()
                    )
            );
        } catch (AuthenticationException exception) {
            throw new InvalidCredentialsException();
        }

        var usuario = repository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);
        return new LoginResponse(
                tokenService.generate(usuario),
                "Bearer",
                tokenService.expiresInSeconds(),
                new AuthenticatedUserResponse(
                        usuario.getId(),
                        usuario.getNome(),
                        usuario.getEmail(),
                        usuario.getRole()
                )
        );
    }
}
