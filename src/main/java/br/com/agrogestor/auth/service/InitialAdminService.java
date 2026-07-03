package br.com.agrogestor.auth.service;

import br.com.agrogestor.auth.entity.Usuario;
import br.com.agrogestor.auth.entity.UsuarioRole;
import br.com.agrogestor.auth.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InitialAdminService implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(InitialAdminService.class);
    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String name;
    private final String email;
    private final String password;

    public InitialAdminService(
            UsuarioRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${agrogestor.security.bootstrap-admin.enabled}") boolean enabled,
            @Value("${agrogestor.security.bootstrap-admin.name}") String name,
            @Value("${agrogestor.security.bootstrap-admin.email}") String email,
            @Value("${agrogestor.security.bootstrap-admin.password}") String password
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.name = name;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        if (!enabled || repository.count() > 0) {
            return;
        }
        repository.save(new Usuario(
                name,
                email,
                passwordEncoder.encode(password),
                UsuarioRole.ADMIN
        ));
        LOGGER.warn(
                "Administrador inicial criado para {}. Altere APP_ADMIN_PASSWORD em ambientes compartilhados.",
                email
        );
    }
}
