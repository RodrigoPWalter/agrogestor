package br.com.agrogestor.expense.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PlantingExpenseSummaryResponse(
        UUID plantingId,
        String crop,
        String harvest,
        BigDecimal plantedAreaHectares,
        BigDecimal totalExpenses,
        BigDecimal expensePerHectare,
        long expenseCount,
        List<ExpenseCategorySummaryResponse> categories
) {
}
