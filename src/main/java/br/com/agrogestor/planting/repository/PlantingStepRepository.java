package br.com.agrogestor.planting.repository;

import br.com.agrogestor.planting.entity.PlantingStep;
import br.com.agrogestor.planting.entity.PlantingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlantingStepRepository extends JpaRepository<PlantingStep, UUID> {

    List<PlantingStep> findByPlantingIdOrderByStepDateAscCreatedAtAsc(UUID plantingId);

    Optional<PlantingStep> findByIdAndPlantingId(UUID id, UUID plantingId);

    Optional<PlantingStep> findByDiaryEntryId(UUID diaryEntryId);

    List<PlantingStep> findByDiaryEntryIdIn(Collection<UUID> diaryEntryIds);

    Optional<PlantingStep> findFirstByPlantingIdOrderByStepDateAscCreatedAtAsc(
            UUID plantingId
    );

    @Query("""
            select coalesce(sum(step.plantedAreaHectares), 0)
            from PlantingStep step
            where step.planting.id = :plantingId
            """)
    BigDecimal sumAreaByPlantingId(@Param("plantingId") UUID plantingId);

    @Query("""
            select coalesce(sum(step.plantedAreaHectares), 0)
            from PlantingStep step
            where step.planting.property.id = :propertyId
              and step.planting.status = :status
            """)
    BigDecimal sumAreaByPlantingPropertyIdAndStatus(
            @Param("propertyId") UUID propertyId,
            @Param("status") PlantingStatus status);

    @Query("""
            select step.planting.id as plantingId,
                   sum(step.plantedAreaHectares) as plantedArea
            from PlantingStep step
            where step.planting.id in :plantingIds
            group by step.planting.id
            """)
    List<PlantingAreaTotalProjection> sumAreasByPlantingIds(
            @Param("plantingIds") Collection<UUID> plantingIds
    );
}
