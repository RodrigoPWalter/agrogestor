package br.com.agrogestor.planting.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PlantingRequest(
        @NotBlank(message = "A cultura é obrigatória")
        @Size(max = 80, message = "A cultura deve ter no máximo 80 caracteres")
        String crop,

        @NotBlank(message = "A safra é obrigatória")
        @Pattern(regexp = "^\\d{4}/\\d{4}$", message = "A safra deve seguir o formato 2026/2027")
        String harvest,

        @NotNull(message = "A área plantada é obrigatória")
        @DecimalMin(value = "0.01", message = "A área plantada deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "A área aceita até 10 inteiros e 2 decimais")
        BigDecimal plantedAreaHectares,

        @NotNull(message = "A data de plantio é obrigatória")
        LocalDate plantingDate,

        @NotBlank(message = "A variedade da semente é obrigatória")
        @Size(max = 120, message = "A variedade deve ter no máximo 120 caracteres")
        String seedVariety,

        @NotNull(message = "A quantidade de sementes é obrigatória")
        @DecimalMin(value = "0.001", message = "A quantidade de sementes deve ser maior que zero")
        @Digits(integer = 11, fraction = 3, message = "A quantidade aceita até 11 inteiros e 3 decimais")
        BigDecimal seedQuantity,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String observations
) {
}
