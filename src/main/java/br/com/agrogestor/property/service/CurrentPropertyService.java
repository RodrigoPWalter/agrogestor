package br.com.agrogestor.property.service;

import br.com.agrogestor.auth.repository.UsuarioRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentPropertyService {

    private final UsuarioRepository usuarioRepository;

    public CurrentPropertyService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Property get() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessRuleException("Não foi possível identificar a propriedade da sessão");
        }
        return usuarioRepository.findByEmailIgnoreCase(authentication.getName())
                .map(usuario -> usuario.getProperty())
                .orElseThrow(() -> new BusinessRuleException(
                        "A conta não está vinculada a uma propriedade"
                ));
    }

    public UUID id() {
        return get().getId();
    }
}
