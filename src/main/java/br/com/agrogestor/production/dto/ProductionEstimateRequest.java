package br.com.agrogestor.production.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductionEstimateRequest(
        @NotNull(message = "A área em hectares é obrigatória")
        @DecimalMin(value = "0.01", message = "A área em hectares deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "A área aceita até 10 inteiros e 2 decimais")
        BigDecimal hectares,

        @NotNull(message = "A produtividade esperada é obrigatória")
        @DecimalMin(value = "0.01", message = "A produtividade esperada deve ser maior que zero")
        @Digits(integer = 8, fraction = 2, message = "A produtividade aceita até 8 inteiros e 2 decimais")
        BigDecimal expectedYieldBagsPerHectare,

        @NotNull(message = "O preço estimado da saca é obrigatório")
        @DecimalMin(value = "0.01", message = "O preço estimado da saca deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "O preço aceita até 10 inteiros e 2 decimais")
        BigDecimal estimatedPricePerBag,

        @DecimalMin(value = "0.00", message = "O custo total não pode ser negativo")
        @Digits(integer = 12, fraction = 2, message = "O custo total aceita até 12 inteiros e 2 decimais")
        BigDecimal totalEstimatedCost,

        @DecimalMin(value = "0.00", message = "O custo por hectare não pode ser negativo")
        @Digits(integer = 10, fraction = 2, message = "O custo por hectare aceita até 10 inteiros e 2 decimais")
        BigDecimal costPerHectare
) {

    @AssertTrue(message = "Informe apenas o custo total estimado ou o custo por hectare")
    public boolean isCostInputValid() {
        return (totalEstimatedCost == null) != (costPerHectare == null);
    }
}
