package br.com.agrogestor.auth.repository;

import br.com.agrogestor.auth.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select user from Usuario user where user.id = :id")
    Optional<Usuario> findForIdempotencyLock(@Param("id") UUID id);

    Optional<Usuario> findByEmailIgnoreCase(String email);
    List<Usuario> findAllByOrderByCreatedAtAsc();

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);
}
