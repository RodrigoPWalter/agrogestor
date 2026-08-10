package br.com.agrogestor.expense.dto;

import java.math.BigDecimal;
import java.util.List;

public record PropertyExpenseSummaryResponse(
        BigDecimal totalExpenses,
        BigDecimal averageExpense,
        long expenseCount,
        List<ExpenseCategorySummaryResponse> categories
) {
}
