package br.com.agrogestor.inventory.repository;

import br.com.agrogestor.inventory.entity.InventoryValuationAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryValuationAdjustmentRepository
        extends JpaRepository<InventoryValuationAdjustment, UUID> {

    List<InventoryValuationAdjustment>
            findTop50ByProductIdOrderByAdjustmentDateDescCreatedAtDesc(UUID productId);
}
