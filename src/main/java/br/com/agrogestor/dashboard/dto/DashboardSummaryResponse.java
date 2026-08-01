package br.com.agrogestor.dashboard.dto;

import java.util.List;

public record DashboardSummaryResponse(
        DashboardMetricsResponse metrics,
        List<DashboardPlantingResponse> recentPlantings,
        List<DashboardExpenseResponse> recentExpenses,
        List<DashboardInventoryProductResponse> inventoryProducts
) {
}
