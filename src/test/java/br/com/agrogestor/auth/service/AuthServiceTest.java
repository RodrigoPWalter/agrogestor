package br.com.agrogestor.auth.service;

import br.com.agrogestor.auth.dto.LoginRequest;
import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.entity.UsuarioRole;
import br.com.agrogestor.auth.exception.InvalidCredentialsException;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.auth.security.JwtTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
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
    private AuthService service;

    @BeforeEach
    void setUp() {
        authenticationManager = mock(AuthenticationManager.class);
        repository = mock(UsuarioRepository.class);
        tokenService = mock(JwtTokenService.class);
        service = new AuthService(authenticationManager, repository, tokenService);
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
