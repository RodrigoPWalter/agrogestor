package br.com.agrogestor.inventory.dto;

import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.ProductType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InventoryProductUpdateRequest(
        @NotBlank @Size(max = 140) String name,
        @NotNull ProductType productType,
        @NotNull MeasurementUnit unit,
        @NotNull @DecimalMin("0.0") @Digits(integer = 11, fraction = 3) BigDecimal minimumStock,
        LocalDate expirationDate,
        @DecimalMin(value = "0.000001", message = "O novo custo unitário deve ser maior que zero")
        @Digits(integer = 10, fraction = 6,
                message = "O custo aceita até 10 inteiros e 6 casas decimais")
        BigDecimal newUnitCost,
        @PastOrPresent(message = "A data do ajuste não pode estar no futuro")
        LocalDate adjustmentDate
) {
}
