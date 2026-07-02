package br.com.agrogestor.diary.dto;

import br.com.agrogestor.diary.entity.ActivityType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.List;

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
        OffsetDateTime updatedAt
) {
}
