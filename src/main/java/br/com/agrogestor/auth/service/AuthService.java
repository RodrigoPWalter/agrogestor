package br.com.agrogestor.auth.service;

import br.com.agrogestor.auth.dto.AuthenticatedUserResponse;
import br.com.agrogestor.auth.dto.LoginRequest;
import br.com.agrogestor.auth.dto.LoginResponse;
import br.com.agrogestor.auth.dto.ProfileUpdateRequest;
import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.exception.InvalidCredentialsException;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.auth.security.JwtTokenService;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository repository;
    private final JwtTokenService tokenService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            UsuarioRepository repository,
            JwtTokenService tokenService,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.repository = repository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder;
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
        return loginResponse(usuario);
    }

    @Transactional
    public LoginResponse updateProfile(
            String authenticatedEmail,
            ProfileUpdateRequest request
    ) {
        var usuario = repository.findByEmailIgnoreCase(authenticatedEmail)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
            throw new BusinessRuleException("A senha atual está incorreta");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (repository.existsByEmailIgnoreCaseAndIdNot(email, usuario.getId())) {
            throw new BusinessRuleException("Este e-mail já está sendo utilizado");
        }

        usuario.atualizarDados(request.nome(), email, usuario.getRole());
        if (request.novaSenha() != null && !request.novaSenha().isBlank()) {
            usuario.atualizarSenha(passwordEncoder.encode(request.novaSenha()));
        }

        return loginResponse(repository.save(usuario));
    }

    private LoginResponse loginResponse(Usuario usuario) {
        return new LoginResponse(
                tokenService.generate(usuario),
                "Bearer",
                tokenService.expiresInSeconds(),
                new AuthenticatedUserResponse(
                        usuario.getId(),
                        usuario.getNome(),
                        usuario.getEmail(),
                        usuario.getRole(),
                        usuario.getProperty().getId(),
                        usuario.getProperty().getName()
                )
        );
    }
}
