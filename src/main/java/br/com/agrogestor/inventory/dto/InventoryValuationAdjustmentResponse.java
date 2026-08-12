package br.com.agrogestor.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record InventoryValuationAdjustmentResponse(
        UUID id,
        UUID productId,
        String productName,
        LocalDate adjustmentDate,
        BigDecimal previousUnitCost,
        BigDecimal newUnitCost,
        BigDecimal previousInventoryValue,
        BigDecimal newInventoryValue,
        String reason,
        OffsetDateTime createdAt
) {
}
