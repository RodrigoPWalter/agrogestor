package br.com.agrogestor.auth.service;

import br.com.agrogestor.auth.dto.LoginRequest;
import br.com.agrogestor.auth.dto.ProfileUpdateRequest;
import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.entity.UsuarioRole;
import br.com.agrogestor.auth.exception.InvalidCredentialsException;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.auth.security.JwtTokenService;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private AuthenticationManager authenticationManager;
    private UsuarioRepository repository;
    private JwtTokenService tokenService;
    private PasswordEncoder passwordEncoder;
    private AuthService service;

    @BeforeEach
    void setUp() {
        authenticationManager = mock(AuthenticationManager.class);
        repository = mock(UsuarioRepository.class);
        tokenService = mock(JwtTokenService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        service = new AuthService(
                authenticationManager,
                repository,
                tokenService,
                passwordEncoder
        );
    }

    @Test
    void shouldAuthenticateAndReturnToken() {
        Usuario usuario = usuario();
        when(repository.findByEmailIgnoreCase("admin@agrogestor.local"))
                .thenReturn(Optional.of(usuario));
        when(tokenService.generate(usuario)).thenReturn("jwt-assinado");
        when(tokenService.expiresInSeconds()).thenReturn(3600L);

        var response = service.login(new LoginRequest(
                " ADMIN@AgroGestor.Local ",
                "senha"
        ));

        verify(authenticationManager).authenticate(any());
        assertThat(response.accessToken()).isEqualTo("jwt-assinado");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.user().id()).isEqualTo(usuario.getId());
        assertThat(response.user().role()).isEqualTo(UsuarioRole.ADMIN);
    }

    @Test
    void shouldHideReasonForInvalidCredentials() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Senha incorreta"));

        assertThatThrownBy(() -> service.login(new LoginRequest(
                "admin@agrogestor.local",
                "senha-incorreta"
        )))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("E-mail ou senha inválidos");
    }

    @Test
    void shouldUpdateProfileAndReturnAValidSession() {
        Usuario usuario = usuario();
        when(repository.findByEmailIgnoreCase("admin@agrogestor.local"))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha-atual", "hash")).thenReturn(true);
        when(passwordEncoder.encode("nova-senha")).thenReturn("novo-hash");
        when(repository.save(usuario)).thenReturn(usuario);
        when(tokenService.generate(usuario)).thenReturn("novo-jwt");
        when(tokenService.expiresInSeconds()).thenReturn(3600L);

        var response = service.updateProfile(
                "admin@agrogestor.local",
                new ProfileUpdateRequest(
                        "Rodrigo",
                        " RODRIGO@AGRO.LOCAL ",
                        "senha-atual",
                        "nova-senha"
                )
        );

        assertThat(usuario.getNome()).isEqualTo("Rodrigo");
        assertThat(usuario.getEmail()).isEqualTo("rodrigo@agro.local");
        assertThat(usuario.getSenhaHash()).isEqualTo("novo-hash");
        assertThat(response.accessToken()).isEqualTo("novo-jwt");
        assertThat(response.user().email()).isEqualTo("rodrigo@agro.local");
    }

    @Test
    void shouldRejectProfileUpdateWhenCurrentPasswordIsWrong() {
        Usuario usuario = usuario();
        when(repository.findByEmailIgnoreCase("admin@agrogestor.local"))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha-incorreta", "hash"))
                .thenReturn(false);

        assertThatThrownBy(() -> service.updateProfile(
                "admin@agrogestor.local",
                new ProfileUpdateRequest(
                        "Administrador",
                        "admin@agrogestor.local",
                        "senha-incorreta",
                        null
                )
        ))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("A senha atual está incorreta");
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
