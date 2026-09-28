package br.com.agrogestor.task.dto;

import br.com.agrogestor.task.entity.FarmTaskCategory;
import br.com.agrogestor.task.entity.FarmTaskStatus;
import br.com.agrogestor.task.entity.FarmTaskUrgency;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record FarmTaskResponse(
        UUID id,
        String title,
        FarmTaskCategory category,
        String categoryLabel,
        FarmTaskStatus status,
        String statusLabel,
        FarmTaskUrgency urgency,
        String urgencyLabel,
        LocalDate dueDate,
        Integer estimatedDurationMinutes,
        UUID plantingId,
        String plantingLabel,
        UUID machineId,
        String machineLabel,
        String notes,
        OffsetDateTime completedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
