package br.com.agrogestor.auth.security;

import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.entity.UsuarioRole;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private UsuarioRepository repository;
    private JwtTokenService tokens;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        repository = mock(UsuarioRepository.class);
        tokens = mock(JwtTokenService.class);
        filter = new JwtAuthenticationFilter(tokens, new UsuarioDetailsService(repository));
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void oldEmailNeverDeterminesTheAccountOrPropertyOfAnExistingToken() throws Exception {
        Usuario owner = user("novo@agro.test", UsuarioRole.USER);
        when(tokens.decode("token")).thenReturn(jwt(owner.getId().toString()));
        when(repository.findById(owner.getId())).thenReturn(Optional.of(owner));

        authenticate();

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication.getName()).isEqualTo(owner.getId().toString());
        assertThat(authentication.getAuthorities()).extracting("authority")
                .containsExactly("ROLE_USER");
        // Mesmo se outra conta adotar antigo@agro.test, nenhuma consulta usa esse e-mail.
        assertThat(new CurrentPropertyService(repository).get()).isSameAs(owner.getProperty());
        verify(repository, never()).findByEmailIgnoreCase(anyString());
    }

    @Test
    void deletedUserCannotBecomeTheNewOwnerOfTheirFormerEmail() throws Exception {
        UUID deletedUser = UUID.randomUUID();
        when(tokens.decode("token")).thenReturn(jwt(deletedUser.toString()));
        when(repository.findById(deletedUser)).thenReturn(Optional.empty());

        authenticate();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(repository, never()).findByEmailIgnoreCase(anyString());
    }

    @Test
    void rejectsInactiveUsersEvenWithAValidToken() throws Exception {
        Usuario owner = user("produtor@agro.test", UsuarioRole.USER);
        ReflectionTestUtils.setField(owner, "active", false);
        when(tokens.decode("token")).thenReturn(jwt(owner.getId().toString()));
        when(repository.findById(owner.getId())).thenReturn(Optional.of(owner));

        authenticate();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void rejectsMissingOrMalformedUserIdInsteadOfFallingBackToEmail() throws Exception {
        when(tokens.decode("token")).thenReturn(jwt(null));
        authenticate();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();

        when(tokens.decode("token")).thenReturn(jwt("not-a-uuid"));
        authenticate();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(repository, never()).findByEmailIgnoreCase(anyString());
    }

    @Test
    void invalidOrExpiredTokenRemainsUnauthenticated() throws Exception {
        when(tokens.decode("token")).thenThrow(new JwtException("Token expirado"));
        authenticate();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private void authenticate() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/v1/plantings");
        request.addHeader("Authorization", "Bearer token");
        AtomicInteger calls = new AtomicInteger();
        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> calls.incrementAndGet());
        assertThat(calls).hasValue(1);
    }

    private Jwt jwt(String id) {
        var builder = Jwt.withTokenValue("token").header("alg", "HS256")
                .subject("antigo@agro.test");
        if (id != null) builder.claim("uid", id);
        return builder.build();
    }

    private Usuario user(String email, UsuarioRole role) {
        Usuario user = new Usuario(new Property("Propriedade"), "Produtor", email, "hash", role);
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        return user;
    }
}
