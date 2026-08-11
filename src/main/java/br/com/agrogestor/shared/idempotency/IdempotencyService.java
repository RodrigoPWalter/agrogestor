package br.com.agrogestor.shared.idempotency;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class IdempotencyService {

    private final IdempotencyRecordRepository repository;
    private final long retentionDays;
    private final Clock clock;

    @Autowired
    public IdempotencyService(
            IdempotencyRecordRepository repository,
            @Value("${agrogestor.idempotency.retention-days:90}") long retentionDays
    ) {
        this(repository, retentionDays, Clock.systemUTC());
    }

    IdempotencyService(
            IdempotencyRecordRepository repository,
            long retentionDays,
            Clock clock
    ) {
        this.repository = repository;
        this.retentionDays = Math.max(1, retentionDays);
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> find(String username, String requestKey) {
        return repository.findByUsernameAndRequestKey(username, requestKey);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void remember(IdempotencyRecord record) {
        try {
            repository.saveAndFlush(record);
        } catch (DataIntegrityViolationException ignored) {
            // Uma repetição simultânea já registrou a mesma operação.
        }
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
