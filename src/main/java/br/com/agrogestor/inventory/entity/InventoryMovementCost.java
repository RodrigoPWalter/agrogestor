package br.com.agrogestor.inventory.entity;

import java.math.BigDecimal;

public record InventoryMovementCost(
        BigDecimal unitCost,
        BigDecimal totalCost
) {
}
