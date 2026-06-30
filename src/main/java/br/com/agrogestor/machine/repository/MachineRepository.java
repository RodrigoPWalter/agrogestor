package br.com.agrogestor.machine.repository;

import br.com.agrogestor.machine.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface MachineRepository extends JpaRepository<Machine, UUID> {}
