package br.com.agrogestor.planting.repository;

import br.com.agrogestor.planting.entity.HarvestStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HarvestStepRepository extends JpaRepository<HarvestStep, UUID> {

    List<HarvestStep> findByPlantingIdOrderByHarvestDateAscCreatedAtAsc(
            UUID plantingId
    );

    Optional<HarvestStep> findByIdAndPlantingId(UUID id, UUID plantingId);

    Optional<HarvestStep> findByDiaryEntryId(UUID diaryEntryId);

    List<HarvestStep> findByDiaryEntryIdIn(Collection<UUID> diaryEntryIds);

    List<HarvestStep> findByPlantingPropertyId(UUID propertyId);

    @Query("""
            select coalesce(sum(step.harvestedAreaHectares), 0)
            from HarvestStep step
            where step.planting.id = :plantingId
            """)
    BigDecimal sumAreaByPlantingId(@Param("plantingId") UUID plantingId);

    @Query("""
            select step.planting.id as plantingId,
                   sum(step.harvestedAreaHectares) as harvestedArea
            from HarvestStep step
            where step.planting.id in :plantingIds
            group by step.planting.id
            """)
    List<HarvestAreaTotalProjection> sumAreasByPlantingIds(
            @Param("plantingIds") Collection<UUID> plantingIds
    );
}
