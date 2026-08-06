package br.com.agrogestor.auth.service;

import br.com.agrogestor.auth.dto.UserCreateRequest;
import br.com.agrogestor.auth.dto.UserResponse;
import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.entity.UsuarioRole;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.repository.PropertyRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class UserManagementService {

    private final UsuarioRepository usuarioRepository;
    private final PropertyRepository propertyRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(
            UsuarioRepository usuarioRepository,
            PropertyRepository propertyRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.propertyRepository = propertyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return usuarioRepository.findAllByOrderByCreatedAtAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BusinessRuleException("Este e-mail já está sendo utilizado");
        }

        Property property = propertyRepository.save(new Property(request.propriedade()));
        Usuario usuario = usuarioRepository.save(new Usuario(
                property,
                request.nome(),
                email,
                passwordEncoder.encode(request.senha()),
                UsuarioRole.USER
        ));
        return toResponse(usuario);
    }

    private UserResponse toResponse(Usuario usuario) {
        return new UserResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole(),
                usuario.isActive(),
                usuario.getProperty().getId(),
                usuario.getProperty().getName(),
                usuario.getCreatedAt()
        );
    }
}
