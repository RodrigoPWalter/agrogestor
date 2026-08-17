package br.com.agrogestor.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InventoryValuationAdjustmentRequest(
        @NotNull(message = "A data do ajuste é obrigatória")
        @PastOrPresent(message = "A data do ajuste não pode estar no futuro")
        LocalDate adjustmentDate,

        @NotNull(message = "O novo custo unitário é obrigatório")
        @DecimalMin(value = "0.000001", message = "O novo custo unitário deve ser maior que zero")
        @Digits(integer = 10, fraction = 6,
                message = "O custo aceita até 10 inteiros e 6 casas decimais")
        BigDecimal newUnitCost,

        @Size(max = 500, message = "O motivo deve ter no máximo 500 caracteres")
        String reason
) {
}
