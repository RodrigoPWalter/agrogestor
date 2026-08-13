package br.com.agrogestor.machine.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MachineMaintenanceTotals(
        UUID machineId,
        BigDecimal totalCost,
        BigDecimal preventiveCost,
        BigDecimal correctiveCost,
        Long maintenanceCount,
        Long preventiveCount,
        Long correctiveCount
) {}
