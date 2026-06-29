package br.com.agrogestor.seeding.dto;

import java.math.BigDecimal;

public record SeedingEstimateResponse(
        BigDecimal totalEstimatedSeeds,
        BigDecimal totalRowLengthMeters,
        BigDecimal seedsPerHectare,
        BigDecimal seedsPerLinearMeter,
        BigDecimal expectedPlantsPerHectare,
        BigDecimal expectedPlantsPerLinearMeter
) {
}
