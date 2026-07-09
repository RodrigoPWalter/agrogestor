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
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.repository.PlantingRepository;
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
import java.util.UUID;

@Service
public class PlantingService {

    private final PlantingRepository repository;
    private final ExpenseRepository expenseRepository;
    private final FieldDiaryRepository diaryRepository;

    public PlantingService(
            PlantingRepository repository,
            ExpenseRepository expenseRepository,
            FieldDiaryRepository diaryRepository
    ) {
        this.repository = repository;
        this.expenseRepository = expenseRepository;
        this.diaryRepository = diaryRepository;
    }

    @Transactional
    public PlantingResponse create(PlantingRequest request) {
        Planting planting = new Planting(
                normalize(request.crop()),
                request.harvest().trim(),
                request.plantedAreaHectares(),
                request.plantingDate(),
                normalize(request.seedVariety()),
                request.seedQuantity(),
                normalizeNullable(request.observations())
        );
        return toResponse(repository.save(planting));
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
                Sort.by(Sort.Direction.DESC, "plantingDate").and(Sort.by("crop"))
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

        return PageResponse.from(result.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public PlantingResponse findById(UUID id) {
        return toResponse(findEntity(id));
    }

    @Transactional
    public PlantingResponse update(UUID id, PlantingRequest request) {
        Planting planting = findEntity(id);
        planting.update(
                normalize(request.crop()),
                request.harvest().trim(),
                request.plantedAreaHectares(),
                request.plantingDate(),
                normalize(request.seedVariety()),
                request.seedQuantity(),
                normalizeNullable(request.observations())
        );
        return toResponse(planting);
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
        return toResponse(planting);
    }

    @Transactional
    public PlantingResponse reactivate(UUID id) {
        Planting planting = findEntity(id);
        planting.reactivate();
        return toResponse(planting);
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
                planting.getPlantedAreaHectares(),
                money(totalExpenses),
                expensePerHectare(totalExpenses, planting.getPlantedAreaHectares()),
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

    private PlantingResponse toResponse(Planting planting) {
        return new PlantingResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                planting.getPlantedAreaHectares(),
                planting.getPlantingDate(),
                planting.getSeedVariety(),
                planting.getSeedQuantity(),
                planting.getObservations(),
                planting.getStatus(),
                planting.getStatus().getDisplayName(),
                planting.getCompletedAt(),
                planting.getCreatedAt(),
                planting.getUpdatedAt()
        );
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

    private BigDecimal quantity(BigDecimal value) {
        return value == null
                ? BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP)
                : value.setScale(3, RoundingMode.HALF_UP);
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
