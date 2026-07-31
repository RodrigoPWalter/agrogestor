package br.com.agrogestor.planting.dto;

import br.com.agrogestor.planting.entity.HarvestUnit;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record HarvestStepResponse(
        UUID id,
        UUID plantingId,
        LocalDate harvestDate,
        BigDecimal harvestedAreaHectares,
        BigDecimal harvestQuantity,
        HarvestUnit harvestUnit,
        String harvestUnitName,
        String seedVariety,
        LocalTime startTime,
        LocalTime endTime,
        String observations,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
