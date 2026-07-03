package br.com.agrogestor.expense.service;

import br.com.agrogestor.expense.dto.ExpenseCategorySummaryResponse;
import br.com.agrogestor.expense.dto.ExpenseRequest;
import br.com.agrogestor.expense.dto.ExpenseResponse;
import br.com.agrogestor.expense.dto.PlantingExpenseSummaryResponse;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.repository.ExpenseCategoryTotalProjection;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.planting.entity.Planting;
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
import java.util.UUID;

@Service
public class ExpenseService {

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    private final ExpenseRepository expenseRepository;
    private final PlantingRepository plantingRepository;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            PlantingRepository plantingRepository
    ) {
        this.expenseRepository = expenseRepository;
        this.plantingRepository = plantingRepository;
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request) {
        Planting planting = findOptionalPlanting(request.plantingId());
        Expense expense = new Expense(
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
        if (plantingId == null) {
            result = expenseRepository.findAll(pageable);
        } else {
            findPlanting(plantingId);
            result = expenseRepository.findByPlantingId(plantingId, pageable);
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
        expenseRepository.delete(findExpense(id));
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
                        planting.getPlantedAreaHectares(),
                        MONEY_SCALE,
                        ROUNDING_MODE
                );

        return new PlantingExpenseSummaryResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                planting.getPlantedAreaHectares(),
                money(totalExpenses),
                expensePerHectare,
                expenseRepository.countByPlantingId(plantingId),
                categories
        );
    }

    private Expense findExpense(UUID id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Gasto não encontrado com o ID " + id
                ));
    }

    private Planting findPlanting(UUID id) {
        return plantingRepository.findById(id)
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
}
