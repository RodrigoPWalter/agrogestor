package br.com.agrogestor.machine.repository;

import br.com.agrogestor.machine.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

public interface MachineRepository extends JpaRepository<Machine, UUID> {
    List<Machine> findByPropertyIdOrderByBrandAscModelAsc(UUID propertyId);
    Optional<Machine> findByIdAndPropertyId(UUID id, UUID propertyId);
}
