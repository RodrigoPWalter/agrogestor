package br.com.agrogestor.machine.dto;

import br.com.agrogestor.machine.entity.MaintenanceType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MaintenanceResponse(
        UUID id, UUID machineId, String machineName, LocalDate maintenanceDate,
        MaintenanceType maintenanceType, String maintenanceTypeName,
        String replacedParts, BigDecimal cost, BigDecimal nextReviewHours,
        String notes, OffsetDateTime createdAt, OffsetDateTime updatedAt
) {}
