package br.com.agrogestor.inventory.dto;

import br.com.agrogestor.inventory.entity.MovementType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record InventoryMovementResponse(
        UUID id, UUID productId, String productName,
        MovementType movementType, String movementTypeName,
        BigDecimal quantity, LocalDate movementDate, String notes,
        OffsetDateTime createdAt
) {
}
