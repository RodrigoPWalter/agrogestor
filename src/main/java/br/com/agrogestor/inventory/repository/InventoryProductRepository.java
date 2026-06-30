package br.com.agrogestor.inventory.repository;

import br.com.agrogestor.inventory.entity.InventoryProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InventoryProductRepository extends JpaRepository<InventoryProduct, UUID> {
}
