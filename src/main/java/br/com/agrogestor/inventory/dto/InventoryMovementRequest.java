package br.com.agrogestor.inventory.dto;

import br.com.agrogestor.inventory.entity.MovementType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InventoryMovementRequest(
        @NotNull MovementType movementType,
        @NotNull @DecimalMin(value = "0.001") @Digits(integer = 11, fraction = 3) BigDecimal quantity,
        @NotNull LocalDate movementDate,
        @Size(max = 500) String notes
) {
}
