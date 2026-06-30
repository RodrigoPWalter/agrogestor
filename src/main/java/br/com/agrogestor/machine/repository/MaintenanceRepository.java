package br.com.agrogestor.machine.repository;

import br.com.agrogestor.machine.entity.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MaintenanceRepository extends JpaRepository<Maintenance, UUID> {
    List<Maintenance> findByMachineIdOrderByMaintenanceDateDesc(UUID machineId);
    Optional<Maintenance> findFirstByMachineIdAndNextReviewHoursIsNotNullOrderByMaintenanceDateDesc(UUID machineId);
}
