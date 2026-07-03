package br.com.agrogestor.inventory.repository;

import br.com.agrogestor.inventory.entity.InventoryProduct;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface InventoryProductRepository extends JpaRepository<InventoryProduct, UUID> {
    Optional<InventoryProduct> findFirstByNameIgnoreCase(String name);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select product from InventoryProduct product where product.id = :id")
    Optional<InventoryProduct> findByIdForUpdate(@Param("id") UUID id);
}
