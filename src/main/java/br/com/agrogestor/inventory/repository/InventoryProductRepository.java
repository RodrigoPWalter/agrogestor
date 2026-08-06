package br.com.agrogestor.inventory.repository;

import br.com.agrogestor.inventory.entity.InventoryProduct;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

public interface InventoryProductRepository extends JpaRepository<InventoryProduct, UUID> {
    Optional<InventoryProduct> findFirstByPropertyIdAndNameIgnoreCase(UUID propertyId, String name);
    Optional<InventoryProduct> findByIdAndPropertyId(UUID id, UUID propertyId);
    List<InventoryProduct> findByPropertyIdOrderByName(UUID propertyId);
    long countByPropertyId(UUID propertyId);

    @Query("""
            select count(product)
            from InventoryProduct product
            where product.property.id = :propertyId
              and product.quantity <= product.minimumStock
            """)
    long countLowStock(@Param("propertyId") UUID propertyId);

    @Query("""
            select product
            from InventoryProduct product
            where product.property.id = :propertyId
            order by
                case when product.quantity <= product.minimumStock then 0 else 1 end,
                case when product.expirationDate is null then 1 else 0 end,
                product.expirationDate,
                product.name
            """)
    List<InventoryProduct> findForDashboard(@Param("propertyId") UUID propertyId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select product from InventoryProduct product where product.id = :id and product.property.id = :propertyId")
    Optional<InventoryProduct> findByIdAndPropertyIdForUpdate(
            @Param("id") UUID id,
            @Param("propertyId") UUID propertyId);
}
