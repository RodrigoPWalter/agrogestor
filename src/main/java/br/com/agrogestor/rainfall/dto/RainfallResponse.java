package br.com.agrogestor.rainfall.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RainfallResponse(
        UUID id,
        UUID plantingId,
        String plantingCrop,
        LocalDate measurementDate,
        BigDecimal millimeters,
        String notes,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
