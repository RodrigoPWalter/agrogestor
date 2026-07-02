package br.com.agrogestor.planting.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import br.com.agrogestor.planting.entity.PlantingStatus;

public record PlantingResponse(
        UUID id,
        String crop,
        String harvest,
        BigDecimal plantedAreaHectares,
        LocalDate plantingDate,
        String seedVariety,
        BigDecimal seedQuantity,
        String observations,
        PlantingStatus status,
        String statusName,
        OffsetDateTime completedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
