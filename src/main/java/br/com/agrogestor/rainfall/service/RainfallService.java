package br.com.agrogestor.rainfall.service;

import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.rainfall.dto.*;
import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import br.com.agrogestor.rainfall.repository.RainfallRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RainfallService {
    private final RainfallRepository repository;
    private final FieldDiaryRepository diaryRepository;
    private final CurrentPropertyService currentProperty;
    private final Clock clock;

    @Autowired
    public RainfallService(
            RainfallRepository repository,
            FieldDiaryRepository diaryRepository,
            CurrentPropertyService currentProperty,
            @Value("${agrogestor.business-time-zone:America/Sao_Paulo}") String businessTimeZone
    ) {
        this(repository, diaryRepository, currentProperty,
                Clock.system(ZoneId.of(businessTimeZone)));
    }

    RainfallService(
            RainfallRepository repository,
            FieldDiaryRepository diaryRepository,
            CurrentPropertyService currentProperty,
            Clock clock
    ) {
        this.repository = repository;
        this.diaryRepository = diaryRepository;
        this.currentProperty = currentProperty;
        this.clock = clock;
    }

    @Transactional
    public RainfallResponse create(RainfallRequest request) {
        return toResponse(repository.save(new RainfallMeasurement(
                currentProperty.get(),
                request.measurementDate(),
                amount(request.millimeters()),
                normalizeNullable(request.notes())
        )), false);
    }

    @Transactional(readOnly = true)
    public List<RainfallResponse> findAll() {
        UUID propertyId = currentProperty.id();
        Set<UUID> diaryManagedIds = new HashSet<>(
                diaryRepository.findRainfallIdsByPropertyId(propertyId));
        return repository.findByPropertyIdOrderByMeasurementDateDesc(propertyId).stream()
                .map(item -> toResponse(item, diaryManagedIds.contains(item.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RainfallResponse> findByPlanting(UUID plantingId) {
        UUID propertyId = currentProperty.id();
        Set<UUID> diaryManagedIds = new HashSet<>(
                diaryRepository.findRainfallIdsByPropertyId(propertyId));
        return repository.findByPropertyIdAndPlantingIdOrderByMeasurementDateDesc(
                        propertyId, plantingId).stream()
                .map(item -> toResponse(item, diaryManagedIds.contains(item.getId())))
                .toList();
    }

    @Transactional
    public RainfallResponse update(UUID id, RainfallRequest request) {
        RainfallMeasurement measurement = find(id);
        ensureDirectMeasurement(id);
        measurement.update(
                request.measurementDate(),
                amount(request.millimeters()),
                normalizeNullable(request.notes())
        );
        return toResponse(measurement, false);
    }

    @Transactional
    public void delete(UUID id) {
        RainfallMeasurement measurement = find(id);
        ensureDirectMeasurement(id);
        repository.delete(measurement);
    }

    @Transactional(readOnly = true)
    public RainfallSummaryResponse summary() {
        LocalDate today = LocalDate.now(clock);
        LocalDate thirtyDayStart = today.minusDays(29);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate queryStart = thirtyDayStart.isBefore(monthStart) ? thirtyDayStart : monthStart;
        List<RainfallMeasurement> recent =
                repository.findByPropertyIdAndMeasurementDateGreaterThanEqual(
                        currentProperty.id(), queryStart);
        BigDecimal thirtyDays = total(recent.stream()
                .filter(item -> !item.getMeasurementDate().isBefore(thirtyDayStart))
                .toList());
        BigDecimal currentMonth = total(recent.stream()
                .filter(item -> !item.getMeasurementDate().isBefore(monthStart))
                .toList());
        var last = repository.findFirstByPropertyIdOrderByMeasurementDateDesc(
                currentProperty.id()).orElse(null);
        return new RainfallSummaryResponse(
                amount(currentMonth),
                amount(thirtyDays),
                last == null ? null : last.getMeasurementDate(),
                last == null ? null : last.getMillimeters()
        );
    }

    private RainfallMeasurement find(UUID id) {
        return repository.findByIdAndPropertyId(id, currentProperty.id()).orElseThrow(() ->
                new ResourceNotFoundException("Registro de chuva não encontrado com o ID " + id));
    }

    private void ensureDirectMeasurement(UUID id) {
        if (diaryRepository.existsByPropertyIdAndRainfallId(currentProperty.id(), id)) {
            throw new BusinessRuleException(
                    "Esta chuva foi registrada pelo Diário. Edite ou exclua o acontecimento no Diário"
            );
        }
    }

    private RainfallResponse toResponse(RainfallMeasurement measurement, boolean diaryManaged) {
        var planting = measurement.getPlanting();
        return new RainfallResponse(
                measurement.getId(),
                planting == null ? null : planting.getId(),
                planting == null ? null : planting.getCrop(),
                measurement.getMeasurementDate(),
                measurement.getMillimeters(), measurement.getNotes(),
                measurement.getCreatedAt(), measurement.getUpdatedAt(), diaryManaged
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
