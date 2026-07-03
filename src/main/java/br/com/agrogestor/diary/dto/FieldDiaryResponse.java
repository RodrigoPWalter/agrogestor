package br.com.agrogestor.diary.dto;

import br.com.agrogestor.diary.entity.ActivityType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record FieldDiaryResponse(
        UUID id,
        UUID plantingId,
        String crop,
        String harvest,
        LocalDate entryDate,
        ActivityType activityType,
        String activityTypeName,
        String activity,
        String weatherCondition,
        String appliedProducts,
        List<FieldDiaryProductResponse> products,
        String observations,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        BigDecimal rainfallMillimeters,
        String supplier,
        BigDecimal amount,
        UUID machineId,
        BigDecimal harvestQuantity,
        String harvestUnit
) {
}
