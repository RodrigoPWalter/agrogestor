package br.com.agrogestor.auth.security;

import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository repository;

    public UsuarioDetailsService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        var usuario = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        return toUserDetails(usuario);
    }

    public UserDetails loadUserById(UUID id) {
        var usuario = repository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        return toUserDetails(usuario);
    }

    private UserDetails toUserDetails(Usuario usuario) {
        return User.withUsername(usuario.getId().toString())
                .password(usuario.getSenhaHash())
                .roles(usuario.getRole().name())
                .disabled(!usuario.isActive())
                .build();
    }
}
