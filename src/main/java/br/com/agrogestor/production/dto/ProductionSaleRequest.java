package br.com.agrogestor.production.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProductionSaleRequest(
        @NotNull(message = "A data da venda é obrigatória")
        @PastOrPresent(message = "A data da venda não pode estar no futuro")
        LocalDate saleDate,

        @NotNull(message = "A quantidade vendida é obrigatória")
        @DecimalMin(value = "0.001", message = "A quantidade vendida deve ser maior que zero")
        @Digits(integer = 11, fraction = 3, message = "A quantidade aceita até 11 inteiros e 3 decimais")
        BigDecimal quantityBags,

        @NotNull(message = "O preço por saca é obrigatório")
        @DecimalMin(value = "0.01", message = "O preço por saca deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "O preço aceita até 10 inteiros e 2 decimais")
        BigDecimal pricePerBag,

        @Size(max = 120, message = "O comprador deve ter no máximo 120 caracteres")
        String buyer,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String observations
) {
}
