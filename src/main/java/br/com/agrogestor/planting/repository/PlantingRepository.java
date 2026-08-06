package br.com.agrogestor.planting.repository;

import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.math.BigDecimal;

public interface PlantingRepository extends JpaRepository<Planting, UUID> {

    Page<Planting> findByPropertyId(UUID propertyId, Pageable pageable);
    Page<Planting> findByPropertyIdAndHarvestIgnoreCase(UUID propertyId, String harvest, Pageable pageable);
    Page<Planting> findByPropertyIdAndStatus(UUID propertyId, PlantingStatus status, Pageable pageable);
    long countByPropertyIdAndStatus(UUID propertyId, PlantingStatus status);
    List<Planting> findByPropertyIdAndStatusOrderByStartDateDescCropAsc(
            UUID propertyId, PlantingStatus status,
            Pageable pageable
    );
    Page<Planting> findByPropertyIdAndHarvestIgnoreCaseAndStatus(
            UUID propertyId, String harvest, PlantingStatus status, Pageable pageable);
    Optional<Planting> findByIdAndPropertyId(UUID id, UUID propertyId);

    @Query("select distinct p.harvest from Planting p where p.property.id = :propertyId order by p.harvest desc")
    List<String> findDistinctHarvests(@Param("propertyId") UUID propertyId);

    @Query("""
            select coalesce(sum(planting.plannedAreaHectares), 0)
            from Planting planting
            where planting.property.id = :propertyId and planting.status = :status
            """)
    BigDecimal sumPlannedAreaByPropertyIdAndStatus(
            @Param("propertyId") UUID propertyId,
            @Param("status") PlantingStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select planting from Planting planting where planting.id = :id and planting.property.id = :propertyId")
    Optional<Planting> findByIdAndPropertyIdForUpdate(
            @Param("id") UUID id,
            @Param("propertyId") UUID propertyId);
}
