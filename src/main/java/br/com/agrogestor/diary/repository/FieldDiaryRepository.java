package br.com.agrogestor.diary.repository;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface FieldDiaryRepository extends JpaRepository<FieldDiaryEntry, UUID> {
    Page<FieldDiaryEntry> findByPropertyId(UUID propertyId, Pageable pageable);
    Page<FieldDiaryEntry> findByPropertyIdAndPlantingId(UUID propertyId, UUID plantingId, Pageable pageable);
    java.util.Optional<FieldDiaryEntry> findByIdAndPropertyId(UUID id, UUID propertyId);

    List<FieldDiaryEntry> findByPlantingIdAndActivityType(UUID plantingId, ActivityType activityType);

    boolean existsByPropertyIdAndRainfallId(UUID propertyId, UUID rainfallId);

    boolean existsByPropertyIdAndMaintenanceId(UUID propertyId, UUID maintenanceId);

    @Query("select entry.rainfallId from FieldDiaryEntry entry "
            + "where entry.property.id = :propertyId and entry.rainfallId is not null")
    List<UUID> findRainfallIdsByPropertyId(@Param("propertyId") UUID propertyId);

    @Query("select entry.maintenanceId from FieldDiaryEntry entry "
            + "where entry.property.id = :propertyId and entry.maintenanceId is not null")
    List<UUID> findMaintenanceIdsByPropertyId(@Param("propertyId") UUID propertyId);
}
