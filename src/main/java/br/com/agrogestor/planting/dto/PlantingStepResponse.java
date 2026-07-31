package br.com.agrogestor.planting.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PlantingStepResponse(
        UUID id,
        UUID plantingId,
        LocalDate stepDate,
        BigDecimal plantedAreaHectares,
        String seedVariety,
        LocalTime startTime,
        LocalTime endTime,
        String observations,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
