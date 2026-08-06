package br.com.agrogestor.rainfall.repository;

import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RainfallRepository extends JpaRepository<RainfallMeasurement, UUID> {
    List<RainfallMeasurement> findByPropertyIdOrderByMeasurementDateDesc(UUID propertyId);
    List<RainfallMeasurement> findByPropertyIdAndPlantingIdOrderByMeasurementDateDesc(UUID propertyId, UUID plantingId);
    List<RainfallMeasurement> findByPropertyIdAndMeasurementDateGreaterThanEqual(UUID propertyId, LocalDate startDate);
    Optional<RainfallMeasurement> findFirstByPropertyIdOrderByMeasurementDateDesc(UUID propertyId);
    Optional<RainfallMeasurement> findByIdAndPropertyId(UUID id, UUID propertyId);
}
