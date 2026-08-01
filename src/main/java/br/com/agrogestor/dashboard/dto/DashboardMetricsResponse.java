package br.com.agrogestor.dashboard.dto;

import java.math.BigDecimal;

public record DashboardMetricsResponse(
        BigDecimal plantedAreaHectares,
        BigDecimal plannedAreaHectares,
        long activePlantingsCount,
        BigDecimal totalExpenses,
        long expenseCount,
        long inventoryProductCount,
        long lowStockProductCount,
        BigDecimal costPerHectare
) {
}
