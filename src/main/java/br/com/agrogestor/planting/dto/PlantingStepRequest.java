package br.com.agrogestor.planting.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record PlantingStepRequest(
        @NotNull(message = "A data da etapa é obrigatória")
        @PastOrPresent(message = "A data da etapa não pode estar no futuro")
        LocalDate stepDate,

        @NotNull(message = "A área plantada na etapa é obrigatória")
        @DecimalMin(value = "0.01", message = "A área da etapa deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "A área aceita até 10 inteiros e 2 decimais")
        BigDecimal plantedAreaHectares,

        @Size(max = 120, message = "A variedade deve ter no máximo 120 caracteres")
        String seedVariety,

        LocalTime startTime,

        LocalTime endTime,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String observations
) {
}
