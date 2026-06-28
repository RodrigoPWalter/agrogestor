package br.com.agrogestor.production.dto;

import java.math.BigDecimal;

public record ProductionEstimateResponse(
        BigDecimal totalEstimatedProductionBags,
        BigDecimal estimatedGrossRevenue,
        BigDecimal totalCost,
        BigDecimal estimatedProfit
) {
}
