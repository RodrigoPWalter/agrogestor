package br.com.agrogestor.machine.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MachineResponse(
        UUID id, String model, String brand, Integer manufactureYear,
        BigDecimal usageHours, BigDecimal nextReviewHours,
        boolean reviewDue,
        BigDecimal totalMaintenanceCost,
        BigDecimal preventiveMaintenanceCost,
        BigDecimal correctiveMaintenanceCost,
        long maintenanceCount,
        long preventiveMaintenanceCount,
        long correctiveMaintenanceCount,
        OffsetDateTime createdAt, OffsetDateTime updatedAt
) {}
