package br.com.agrogestor.rainfall.repository;

import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RainfallRepository extends JpaRepository<RainfallMeasurement, UUID> {
    List<RainfallMeasurement> findAllByOrderByMeasurementDateDesc();
    List<RainfallMeasurement> findByMeasurementDateGreaterThanEqual(LocalDate startDate);
    Optional<RainfallMeasurement> findFirstByOrderByMeasurementDateDesc();
}
