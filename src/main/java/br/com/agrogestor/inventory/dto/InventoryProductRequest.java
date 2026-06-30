package br.com.agrogestor.inventory.dto;

import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.ProductType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InventoryProductRequest(
        @NotBlank @Size(max = 140) String name,
        @NotNull ProductType productType,
        @NotNull @DecimalMin("0.0") @Digits(integer = 11, fraction = 3) BigDecimal initialQuantity,
        @NotNull MeasurementUnit unit,
        @NotNull @DecimalMin("0.0") @Digits(integer = 11, fraction = 3) BigDecimal minimumStock,
        LocalDate expirationDate
) {
}
