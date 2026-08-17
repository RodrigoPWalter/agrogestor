package br.com.agrogestor.production.repository;

import br.com.agrogestor.production.entity.ProductionSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductionSaleRepository extends JpaRepository<ProductionSale, UUID> {

    List<ProductionSale> findByPlantingIdAndPropertyIdOrderBySaleDateDescCreatedAtDesc(
            UUID plantingId,
            UUID propertyId
    );

    List<ProductionSale> findByPropertyIdOrderBySaleDateDescCreatedAtDesc(UUID propertyId);

    Optional<ProductionSale> findByIdAndPlantingIdAndPropertyId(
            UUID id,
            UUID plantingId,
            UUID propertyId
    );

    @Query("""
            select coalesce(sum(sale.quantityBags), 0)
            from ProductionSale sale
            where sale.planting.id = :plantingId
            """)
    BigDecimal sumQuantityByPlantingId(@Param("plantingId") UUID plantingId);
}
