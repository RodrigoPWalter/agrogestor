package br.com.agrogestor.planting.dto;

import br.com.agrogestor.planting.entity.HarvestUnit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record HarvestStepRequest(
        @NotNull(message = "A data da colheita é obrigatória")
        @PastOrPresent(message = "A data da colheita não pode estar no futuro")
        LocalDate harvestDate,

        @NotNull(message = "A área colhida é obrigatória")
        @DecimalMin(value = "0.01", message = "A área colhida deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "A área aceita até 10 inteiros e 2 decimais")
        BigDecimal harvestedAreaHectares,

        @NotNull(message = "A produção colhida é obrigatória")
        @DecimalMin(value = "0.001", message = "A produção colhida deve ser maior que zero")
        @Digits(integer = 11, fraction = 3, message = "A produção aceita até 11 inteiros e 3 decimais")
        BigDecimal harvestQuantity,

        @NotNull(message = "A unidade da colheita é obrigatória")
        HarvestUnit harvestUnit,

        @Size(max = 120, message = "A variedade deve ter no máximo 120 caracteres")
        String seedVariety,

        LocalTime startTime,

        LocalTime endTime,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String observations
) {
}
