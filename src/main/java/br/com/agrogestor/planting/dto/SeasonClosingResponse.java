package br.com.agrogestor.planting.dto;

import br.com.agrogestor.expense.dto.ExpenseCategorySummaryResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SeasonClosingResponse(
        UUID plantingId,
        String crop,
        String harvest,
        BigDecimal plantedAreaHectares,
        BigDecimal totalExpenses,
        BigDecimal expensePerHectare,
        long expenseCount,
        List<ExpenseCategorySummaryResponse> expensesByCategory,
        List<HarvestTotalResponse> harvestTotals,
        BigDecimal mainHarvestQuantity,
        String mainHarvestUnit,
        BigDecimal salePricePerUnit,
        BigDecimal estimatedRevenue,
        BigDecimal estimatedResult,
        boolean revenueEstimated
) {
}
