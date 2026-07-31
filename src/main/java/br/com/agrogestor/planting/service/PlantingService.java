package br.com.agrogestor.planting.service;

import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.expense.dto.ExpenseCategorySummaryResponse;
import br.com.agrogestor.expense.repository.ExpenseCategoryTotalProjection;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.planting.dto.HarvestTotalResponse;
import br.com.agrogestor.planting.dto.PlantingRequest;
import br.com.agrogestor.planting.dto.PlantingResponse;
import br.com.agrogestor.planting.dto.SeasonClosingResponse;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingProgressStatus;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import br.com.agrogestor.planting.repository.PlantingAreaTotalProjection;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.dto.PageResponse;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
public class PlantingService {

    private final PlantingRepository repository;
    private final ExpenseRepository expenseRepository;
    private final FieldDiaryRepository diaryRepository;
    private final PlantingStepRepository stepRepository;

    public PlantingService(
            PlantingRepository repository,
            ExpenseRepository expenseRepository,
            FieldDiaryRepository diaryRepository,
            PlantingStepRepository stepRepository
    ) {
        this.repository = repository;
        this.expenseRepository = expenseRepository;
        this.diaryRepository = diaryRepository;
        this.stepRepository = stepRepository;
    }

    @Transactional
    public PlantingResponse create(PlantingRequest request) {
        Planting planting = new Planting(
                normalize(request.crop()),
                request.harvest().trim(),
                normalizeNullable(request.fieldName()),
                request.plannedAreaHectares(),
                scaleNullable(request.rowSpacingCentimeters(), 2),
                request.startDate(),
                normalize(request.seedVariety()),
                normalizeSeedRate(request.seedRate(), request.seedRateUnit()),
                request.seedRateUnit(),
                normalizeNullable(request.observations())
        );
        return toResponse(repository.save(planting), BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public PageResponse<PlantingResponse> findAll(String harvest, int page, int size) {
        return findAll(harvest, null, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<PlantingResponse> findAll(
            String harvest, PlantingStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "startDate").and(Sort.by("crop"))
        );

        boolean hasHarvest = harvest != null && !harvest.isBlank();
        Page<Planting> result;
        if (status == null) {
            result = hasHarvest
                    ? repository.findByHarvestIgnoreCase(harvest.trim(), pageable)
                    : repository.findAll(pageable);
        } else {
            result = hasHarvest
                    ? repository.findByHarvestIgnoreCaseAndStatus(
                            harvest.trim(), status, pageable)
                    : repository.findByStatus(status, pageable);
        }

        Map<UUID, BigDecimal> plantedAreas = plantedAreas(result.getContent());
        return PageResponse.from(result.map(planting ->
                toResponse(
                        planting,
                        plantedAreas.getOrDefault(planting.getId(), BigDecimal.ZERO)
                )));
    }

    @Transactional(readOnly = true)
    public PlantingResponse findById(UUID id) {
        return toResponse(findEntity(id), plantedArea(id));
    }

    @Transactional
    public PlantingResponse update(UUID id, PlantingRequest request) {
        Planting planting = findEntity(id);
        BigDecimal plantedArea = plantedArea(id);
        if (request.plannedAreaHectares().compareTo(plantedArea) < 0) {
            throw new BusinessRuleException(
                    "A área prevista não pode ser menor que os "
                            + displayArea(plantedArea)
                            + " hectares já plantados"
            );
        }
        stepRepository
                .findFirstByPlantingIdOrderByStepDateAscCreatedAtAsc(id)
                .filter(step -> request.startDate().isAfter(step.getStepDate()))
                .ifPresent(step -> {
                    throw new BusinessRuleException(
                            "A data de início não pode ser posterior à primeira etapa, registrada em "
                                    + step.getStepDate()
                    );
                });
        planting.update(
                normalize(request.crop()),
                request.harvest().trim(),
                normalizeNullable(request.fieldName()),
                request.plannedAreaHectares(),
                scaleNullable(request.rowSpacingCentimeters(), 2),
                request.startDate(),
                normalize(request.seedVariety()),
                normalizeSeedRate(request.seedRate(), request.seedRateUnit()),
                request.seedRateUnit(),
                normalizeNullable(request.observations())
        );
        return toResponse(planting, plantedArea);
    }

    @Transactional
    public void delete(UUID id) {
        Planting planting = findEntity(id);
        repository.delete(planting);
    }

    @Transactional
    public PlantingResponse finish(UUID id) {
        Planting planting = findEntity(id);
        planting.finish();
        return toResponse(planting, plantedArea(id));
    }

    @Transactional
    public PlantingResponse reactivate(UUID id) {
        Planting planting = findEntity(id);
        planting.reactivate();
        return toResponse(planting, plantedArea(id));
    }

    @Transactional(readOnly = true)
    public List<String> findHarvestHistory() {
        return repository.findDistinctHarvests();
    }

    @Transactional(readOnly = true)
    public SeasonClosingResponse seasonClosing(UUID id, BigDecimal salePricePerUnit) {
        Planting planting = findEntity(id);
        List<ExpenseCategoryTotalProjection> totals =
                expenseRepository.summarizeByCategory(id);

        BigDecimal totalExpenses = totals.stream()
                .map(ExpenseCategoryTotalProjection::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ExpenseCategorySummaryResponse> categories = totals.stream()
                .map(item -> new ExpenseCategorySummaryResponse(
                        item.getCategory(),
                        item.getCategory().getDisplayName(),
                        money(item.getTotal()),
                        percentage(item.getTotal(), totalExpenses)
                ))
                .toList();

        List<HarvestTotalResponse> harvestTotals = harvestTotals(id);

        HarvestTotalResponse mainHarvest = harvestTotals.isEmpty()
                ? new HarvestTotalResponse(null, BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP))
                : harvestTotals.getFirst();
        BigDecimal normalizedSalePrice = salePricePerUnit == null
                ? null
                : money(salePricePerUnit);
        BigDecimal estimatedRevenue = normalizedSalePrice == null
                ? null
                : money(mainHarvest.quantity().multiply(normalizedSalePrice));
        BigDecimal estimatedResult = estimatedRevenue == null
                ? null
                : money(estimatedRevenue.subtract(totalExpenses));

        return new SeasonClosingResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                planting.getPlannedAreaHectares(),
                money(totalExpenses),
                expensePerHectare(totalExpenses, planting.getPlannedAreaHectares()),
                expenseRepository.countByPlantingId(id),
                categories,
                harvestTotals,
                mainHarvest.quantity(),
                mainHarvest.unit(),
                normalizedSalePrice,
                estimatedRevenue,
                estimatedResult,
                estimatedRevenue != null
        );
    }

    private Planting findEntity(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plantio não encontrado com o ID " + id));
    }

    private PlantingResponse toResponse(Planting planting, BigDecimal plantedArea) {
        BigDecimal plannedArea = planting.getPlannedAreaHectares();
        BigDecimal normalizedPlantedArea = area(plantedArea);
        BigDecimal remainingArea = area(
                plannedArea.subtract(normalizedPlantedArea).max(BigDecimal.ZERO)
        );
        BigDecimal plantedPercentage = percentage(normalizedPlantedArea, plannedArea);
        PlantingProgressStatus progressStatus = progressStatus(
                normalizedPlantedArea,
                plannedArea
        );

        return new PlantingResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                planting.getFieldName(),
                area(plannedArea),
                planting.getRowSpacingCentimeters(),
                normalizedPlantedArea,
                remainingArea,
                plantedPercentage,
                progressStatus,
                progressStatus.getDisplayName(),
                planting.getStartDate(),
                planting.getSeedVariety(),
                planting.getSeedRate(),
                planting.getSeedRateUnit(),
                planting.getSeedRateUnit() == null
                        ? null
                        : planting.getSeedRateUnit().getDisplayName(),
                planting.getObservations(),
                planting.getStatus(),
                planting.getStatus().getDisplayName(),
                planting.getCompletedAt(),
                planting.getCreatedAt(),
                planting.getUpdatedAt()
        );
    }

    private Map<UUID, BigDecimal> plantedAreas(List<Planting> plantings) {
        if (plantings.isEmpty()) {
            return Map.of();
        }
        return stepRepository
                .sumAreasByPlantingIds(
                        plantings.stream().map(Planting::getId).toList()
                )
                .stream()
                .collect(Collectors.toMap(
                        PlantingAreaTotalProjection::getPlantingId,
                        PlantingAreaTotalProjection::getPlantedArea
                ));
    }

    private BigDecimal plantedArea(UUID plantingId) {
        BigDecimal total = stepRepository.sumAreaByPlantingId(plantingId);
        return total == null ? BigDecimal.ZERO : total;
    }

    private PlantingProgressStatus progressStatus(
            BigDecimal plantedArea,
            BigDecimal plannedArea
    ) {
        if (plantedArea.signum() == 0) {
            return PlantingProgressStatus.NOT_STARTED;
        }
        if (plantedArea.compareTo(plannedArea) >= 0) {
            return PlantingProgressStatus.COMPLETED;
        }
        return PlantingProgressStatus.IN_PROGRESS;
    }

    private List<HarvestTotalResponse> harvestTotals(UUID plantingId) {
        Map<String, BigDecimal> totals = new TreeMap<>();
        diaryRepository.findByPlantingIdAndActivityType(plantingId, ActivityType.HARVEST)
                .stream()
                .filter(entry -> entry.getHarvestQuantity() != null)
                .forEach(entry -> totals.merge(
                        normalizeHarvestUnit(entry),
                        entry.getHarvestQuantity(),
                        BigDecimal::add
                ));

        return totals.entrySet().stream()
                .map(entry -> new HarvestTotalResponse(entry.getKey(), quantity(entry.getValue())))
                .toList();
    }

    private String normalizeHarvestUnit(FieldDiaryEntry entry) {
        return entry.getHarvestUnit() == null || entry.getHarvestUnit().isBlank()
                ? "un."
                : entry.getHarvestUnit().trim();
    }

    private BigDecimal expensePerHectare(BigDecimal total, BigDecimal hectares) {
        if (total.signum() == 0 || hectares.signum() == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return money(total.divide(hectares, 2, RoundingMode.HALF_UP));
    }

    private BigDecimal percentage(BigDecimal value, BigDecimal total) {
        if (total.signum() == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.multiply(new BigDecimal("100"))
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal area(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal quantity(BigDecimal value) {
        return value == null
                ? BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP)
                : value.setScale(3, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleNullable(BigDecimal value, int scale) {
        return value == null ? null : value.setScale(scale, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeSeedRate(
            BigDecimal seedRate,
            SeedRateUnit seedRateUnit
    ) {
        if (seedRateUnit == SeedRateUnit.SEEDS_PER_HECTARE
                && seedRate.stripTrailingZeros().scale() > 0) {
            throw new BusinessRuleException(
                    "A taxa em sementes por hectare deve ser um número inteiro"
            );
        }
        return seedRate.setScale(3, RoundingMode.HALF_UP);
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }

    private String displayArea(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace(".", ",");
    }
}
