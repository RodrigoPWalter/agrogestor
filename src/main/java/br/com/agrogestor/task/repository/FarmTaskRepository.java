package br.com.agrogestor.task.repository;

import br.com.agrogestor.task.entity.FarmTask;
import br.com.agrogestor.task.entity.FarmTaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FarmTaskRepository extends JpaRepository<FarmTask, UUID> {

    Page<FarmTask> findByPropertyId(UUID propertyId, Pageable pageable);

    Page<FarmTask> findByPropertyIdAndStatus(
            UUID propertyId,
            FarmTaskStatus status,
            Pageable pageable
    );

    Page<FarmTask> findByPropertyIdAndStatusNot(
            UUID propertyId,
            FarmTaskStatus status,
            Pageable pageable
    );

    Optional<FarmTask> findByIdAndPropertyId(UUID id, UUID propertyId);
}
