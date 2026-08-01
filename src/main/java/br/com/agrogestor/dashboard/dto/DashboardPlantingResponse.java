package br.com.agrogestor.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DashboardPlantingResponse(
        UUID id,
        String crop,
        String harvest,
        BigDecimal plannedAreaHectares,
        BigDecimal plantedAreaHectares,
        LocalDate startDate,
        String seedVariety
) {
}
