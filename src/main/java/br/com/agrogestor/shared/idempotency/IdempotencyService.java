package br.com.agrogestor.shared.idempotency;

import br.com.agrogestor.auth.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class IdempotencyService {

    private final IdempotencyRecordRepository repository;
    private final UsuarioRepository users;
    private final long retentionDays;
    private final Clock clock;

    @Autowired
    public IdempotencyService(
            IdempotencyRecordRepository repository,
            UsuarioRepository users,
            @Value("${agrogestor.idempotency.retention-days:90}") long retentionDays
    ) {
        this(repository, users, retentionDays, Clock.systemUTC());
    }

    IdempotencyService(
            IdempotencyRecordRepository repository,
            UsuarioRepository users,
            long retentionDays,
            Clock clock
    ) {
        this.repository = repository;
        this.users = users;
        this.retentionDays = Math.max(1, retentionDays);
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> find(String username, String requestKey) {
        return repository.findByUsernameAndRequestKey(username, requestKey);
    }

    @Transactional(readOnly = true)
    public boolean hasLegacyReceipt(String requestKey) {
        return repository.existsByRequestKeyAndUsernameContaining(requestKey, "@");
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void lockUser(UUID userId) {
        var user = users.findForIdempotencyLock(userId)
                .orElseThrow(() -> new AccessDeniedException("Usuário não encontrado"));
        if (!user.isActive()) {
            throw new AccessDeniedException("Usuário inativo");
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void remember(IdempotencyRecord record) {
        repository.saveAndFlush(record);
    }

    @Scheduled(
            cron = "${agrogestor.idempotency.cleanup-cron:0 30 3 * * *}",
            zone = "UTC"
    )
    @Transactional
    public void discardExpiredRecords() {
        OffsetDateTime cutoff = OffsetDateTime.now(clock).minusDays(retentionDays);
        repository.deleteCreatedBefore(cutoff);
    }
}
