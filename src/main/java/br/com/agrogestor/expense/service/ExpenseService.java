package br.com.agrogestor.expense.service;

import br.com.agrogestor.expense.dto.ExpenseCategorySummaryResponse;
import br.com.agrogestor.expense.dto.ExpenseRequest;
import br.com.agrogestor.expense.dto.ExpenseResponse;
import br.com.agrogestor.expense.dto.PlantingExpenseSummaryResponse;
import br.com.agrogestor.expense.dto.PropertyExpenseSummaryResponse;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseOrigin;
import br.com.agrogestor.expense.repository.ExpenseCategoryTotalProjection;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.shared.dto.PageResponse;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class ExpenseService {

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    private final ExpenseRepository expenseRepository;
    private final PlantingRepository plantingRepository;
    private final CurrentPropertyService currentProperty;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            PlantingRepository plantingRepository,
            CurrentPropertyService currentProperty
    ) {
        this.expenseRepository = expenseRepository;
        this.plantingRepository = plantingRepository;
        this.currentProperty = currentProperty;
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request) {
        Planting planting = findOptionalPlanting(request.plantingId());
        Expense expense = new Expense(
                currentProperty.get(),
                planting,
                normalize(request.description()),
                request.category(),
                money(request.amount()),
                request.expenseDate(),
                normalizeNullable(request.observations())
        );
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional(readOnly = true)
    public PageResponse<ExpenseResponse> findAll(
            UUID plantingId,
            boolean unassignedOnly,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "expenseDate")
                        .and(Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        Page<Expense> result;
        UUID propertyId = currentProperty.id();
        if (plantingId != null) {
            findPlanting(plantingId);
            result = expenseRepository.findByPropertyIdAndPlantingId(
                    propertyId, plantingId, pageable);
        } else if (unassignedOnly) {
            result = expenseRepository.findByPropertyIdAndPlantingIsNullAndOrigin(
                    propertyId, ExpenseOrigin.DIRECT, pageable);
        } else {
            result = expenseRepository.findByPropertyIdAndOrigin(
                    propertyId, ExpenseOrigin.DIRECT, pageable);
        }

        return PageResponse.from(result.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public ExpenseResponse findById(UUID id) {
        return toResponse(findExpense(id));
    }

    @Transactional
    public ExpenseResponse update(UUID id, ExpenseRequest request) {
        Expense expense = findExpense(id);
        ensureDirectExpense(expense);
        Planting planting = findOptionalPlanting(request.plantingId());
        expense.update(
                planting,
                normalize(request.description()),
                request.category(),
                money(request.amount()),
                request.expenseDate(),
                normalizeNullable(request.observations())
        );
        return toResponse(expense);
    }

    @Transactional
    public void delete(UUID id) {
        Expense expense = findExpense(id);
        ensureDirectExpense(expense);
        expenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public PlantingExpenseSummaryResponse summarizeByPlanting(UUID plantingId) {
        Planting planting = findPlanting(plantingId);
        List<ExpenseCategoryTotalProjection> totals =
                expenseRepository.summarizeByCategory(plantingId);

        BigDecimal totalExpenses = totals.stream()
                .map(ExpenseCategoryTotalProjection::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ExpenseCategorySummaryResponse> categories = totals.stream()
                .map(item -> new ExpenseCategorySummaryResponse(
                        item.getCategory(),
                        item.getCategory().getDisplayName(),
                        money(item.getTotal()),
                        percentage(item.getTotal(), totalExpenses)
                ))
                .toList();

        BigDecimal expensePerHectare = totalExpenses.signum() == 0
                ? money(BigDecimal.ZERO)
                : totalExpenses.divide(
                        planting.getPlannedAreaHectares(),
                        MONEY_SCALE,
                        ROUNDING_MODE
                );

        return new PlantingExpenseSummaryResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                planting.getPlannedAreaHectares(),
                money(totalExpenses),
                expensePerHectare,
                expenseRepository.countByPlantingId(plantingId),
                categories
        );
    }

    @Transactional(readOnly = true)
    public PropertyExpenseSummaryResponse summarizeUnassigned() {
        UUID propertyId = currentProperty.id();
        List<ExpenseCategoryTotalProjection> totals =
                expenseRepository.summarizeUnassignedByCategory(
                        propertyId, ExpenseOrigin.DIRECT);

        BigDecimal totalExpenses = totals.stream()
                .map(ExpenseCategoryTotalProjection::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long expenseCount = expenseRepository
                .countByPropertyIdAndPlantingIsNullAndOrigin(
                        propertyId, ExpenseOrigin.DIRECT);

        List<ExpenseCategorySummaryResponse> categories = totals.stream()
                .map(item -> new ExpenseCategorySummaryResponse(
                        item.getCategory(),
                        item.getCategory().getDisplayName(),
                        money(item.getTotal()),
                        percentage(item.getTotal(), totalExpenses)
                ))
                .toList();

        BigDecimal averageExpense = expenseCount == 0
                ? money(BigDecimal.ZERO)
                : totalExpenses.divide(
                        BigDecimal.valueOf(expenseCount),
                        MONEY_SCALE,
                        ROUNDING_MODE
                );

        return new PropertyExpenseSummaryResponse(
                money(totalExpenses),
                averageExpense,
                expenseCount,
                categories
        );
    }

    private Expense findExpense(UUID id) {
        return expenseRepository.findByIdAndPropertyId(id, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Gasto não encontrado com o ID " + id
                ));
    }

    private Planting findPlanting(UUID id) {
        return plantingRepository.findByIdAndPropertyId(id, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plantio não encontrado com o ID " + id
                ));
    }

    private Planting findOptionalPlanting(UUID id) {
        return id == null ? null : findPlanting(id);
    }

    private ExpenseResponse toResponse(Expense expense) {
        Planting planting = expense.getPlanting();
        return new ExpenseResponse(
                expense.getId(),
                planting == null ? null : planting.getId(),
                planting == null ? null : planting.getCrop(),
                planting == null ? null : planting.getHarvest(),
                expense.getDescription(),
                expense.getCategory(),
                expense.getCategory().getDisplayName(),
                expense.getAmount(),
                expense.getExpenseDate(),
                expense.getObservations(),
                expense.getOrigin(),
                expense.getOrigin().getDisplayName(),
                expense.getOrigin() == ExpenseOrigin.STOCK_ALLOCATION,
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );
    }

    private BigDecimal percentage(BigDecimal value, BigDecimal total) {
        if (total.signum() == 0) {
            return money(BigDecimal.ZERO);
        }
        return value.multiply(BigDecimal.valueOf(100))
                .divide(total, MONEY_SCALE, ROUNDING_MODE);
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(MONEY_SCALE, ROUNDING_MODE);
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }

    private void ensureDirectExpense(Expense expense) {
        if (expense.getOrigin() == ExpenseOrigin.STOCK_ALLOCATION) {
            throw new BusinessRuleException(
                    "Este custo é controlado pelo uso do produto no estoque. "
                            + "Edite ou exclua o lançamento correspondente no Diário"
            );
        }
    }
}
