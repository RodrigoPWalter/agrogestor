package br.com.agrogestor.expense.dto;

import br.com.agrogestor.expense.entity.ExpenseCategory;

import java.math.BigDecimal;

public record ExpenseCategorySummaryResponse(
        ExpenseCategory category,
        String categoryDisplayName,
        BigDecimal total,
        BigDecimal percentage
) {
}
