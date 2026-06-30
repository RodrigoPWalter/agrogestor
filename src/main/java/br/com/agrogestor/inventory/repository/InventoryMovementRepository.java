package br.com.agrogestor.inventory.repository;

import br.com.agrogestor.inventory.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    List<InventoryMovement> findTop50ByProductIdOrderByMovementDateDescCreatedAtDesc(UUID productId);
}
