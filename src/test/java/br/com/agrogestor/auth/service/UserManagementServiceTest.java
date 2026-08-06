package br.com.agrogestor.auth.service;

import br.com.agrogestor.auth.dto.UserCreateRequest;
import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.repository.PropertyRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserManagementServiceTest {

    private UsuarioRepository usuarioRepository;
    private PropertyRepository propertyRepository;
    private PasswordEncoder passwordEncoder;
    private UserManagementService service;

    @BeforeEach
    void setUp() {
        usuarioRepository = mock(UsuarioRepository.class);
        propertyRepository = mock(PropertyRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        service = new UserManagementService(
                usuarioRepository, propertyRepository, passwordEncoder);
    }

    @Test
    void createsASeparatePropertyAndHashesThePassword() {
        Property property = new Property("Fazenda de testes");
        when(propertyRepository.save(any(Property.class))).thenReturn(property);
        when(passwordEncoder.encode("senha-teste")).thenReturn("hash-bcrypt");
        when(usuarioRepository.save(any(Usuario.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(new UserCreateRequest(
                "Conta Teste",
                "TESTE@EXEMPLO.COM",
                "senha-teste",
                "Fazenda de testes"
        ));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("teste@exemplo.com");
        assertThat(captor.getValue().getSenhaHash()).isEqualTo("hash-bcrypt");
        assertThat(captor.getValue().getProperty()).isSameAs(property);
        assertThat(response.propriedade()).isEqualTo("Fazenda de testes");
    }

    @Test
    void rejectsAnEmailThatAlreadyExists() {
        var request = new UserCreateRequest(
                "Conta Teste", "teste@exemplo.com", "senha-teste", "Teste");
        when(usuarioRepository.findByEmailIgnoreCase("teste@exemplo.com"))
                .thenReturn(Optional.of(mock(Usuario.class)));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("e-mail");
        verify(propertyRepository, never()).save(any());
    }
}
