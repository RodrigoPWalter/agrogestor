package br.com.agrogestor.rainfall.service;

import br.com.agrogestor.rainfall.dto.*;
import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import br.com.agrogestor.rainfall.repository.RainfallRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class RainfallService {
    private final RainfallRepository repository;

    public RainfallService(RainfallRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public RainfallResponse create(RainfallRequest request) {
        return toResponse(repository.save(new RainfallMeasurement(
                request.measurementDate(),
                amount(request.millimeters()),
                normalizeNullable(request.notes())
        )));
    }

    @Transactional(readOnly = true)
    public List<RainfallResponse> findAll() {
        return repository.findAllByOrderByMeasurementDateDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RainfallResponse update(UUID id, RainfallRequest request) {
        RainfallMeasurement measurement = find(id);
        measurement.update(
                request.measurementDate(),
                amount(request.millimeters()),
                normalizeNullable(request.notes())
        );
        return toResponse(measurement);
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(find(id));
    }

    @Transactional(readOnly = true)
    public RainfallSummaryResponse summary() {
        LocalDate today = LocalDate.now();
        List<RainfallMeasurement> recent =
                repository.findByMeasurementDateGreaterThanEqual(today.minusDays(29));
        BigDecimal thirtyDays = total(recent);
        BigDecimal currentMonth = total(recent.stream()
                .filter(item -> item.getMeasurementDate().getMonth() == today.getMonth()
                        && item.getMeasurementDate().getYear() == today.getYear())
                .toList());
        var last = repository.findFirstByOrderByMeasurementDateDesc().orElse(null);
        return new RainfallSummaryResponse(
                amount(currentMonth),
                amount(thirtyDays),
                last == null ? null : last.getMeasurementDate(),
                last == null ? null : last.getMillimeters()
        );
    }

    private RainfallMeasurement find(UUID id) {
        return repository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Registro de chuva não encontrado com o ID " + id));
    }

    private RainfallResponse toResponse(RainfallMeasurement measurement) {
        return new RainfallResponse(
                measurement.getId(), measurement.getMeasurementDate(),
                measurement.getMillimeters(), measurement.getNotes(),
                measurement.getCreatedAt(), measurement.getUpdatedAt()
        );
    }

    private BigDecimal total(List<RainfallMeasurement> values) {
        return values.stream().map(RainfallMeasurement::getMillimeters)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal amount(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
