package br.com.agrogestor.auth.service;

import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.property.repository.PropertyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class InitialAdminServiceTest {

    @Test
    void shouldRejectWeakBootstrapPasswordBeforeCreatingAdmin() {
        UsuarioRepository repository = mock(UsuarioRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        PropertyRepository propertyRepository = mock(PropertyRepository.class);
        when(repository.count()).thenReturn(0L);

        InitialAdminService service = new InitialAdminService(
                repository,
                passwordEncoder,
                propertyRepository,
                true,
                "Administrador",
                "admin@agrogestor.local",
                "curta"
        );

        assertThatThrownBy(() -> service.run(mock(ApplicationArguments.class)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_ADMIN_PASSWORD");

        verifyNoInteractions(propertyRepository, passwordEncoder);
    }
}
