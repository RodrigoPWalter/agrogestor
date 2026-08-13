package br.com.agrogestor.planting.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SeasonClosingPriceRequest(
        @NotNull(message = "O preço recebido por saca é obrigatório")
        @DecimalMin(
                value = "0.01",
                message = "O preço recebido por saca deve ser maior que zero"
        )
        @Digits(
                integer = 10,
                fraction = 2,
                message = "O preço aceita até 10 inteiros e 2 casas decimais"
        )
        BigDecimal salePricePer60KgBag
) {
}
