package br.com.agrogestor.shared.idempotency;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class IdempotencyService {

    private final IdempotencyRecordRepository repository;

    public IdempotencyService(IdempotencyRecordRepository repository) {
        this.repository = repository;
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
}
