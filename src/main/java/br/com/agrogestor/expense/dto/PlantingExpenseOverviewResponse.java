package br.com.agrogestor.expense.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PlantingExpenseOverviewResponse(
        UUID plantingId,
        BigDecimal totalExpenses,
        BigDecimal expensePerHectare,
        long expenseCount
) {
}
