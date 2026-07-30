package br.com.agrogestor.planting.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMax;
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
        @Pattern(
                regexp = "^(\\d{4}|\\d{4}/\\d{4})$",
                message = "A safra deve seguir o formato 2026 ou 2026/2027"
        )
        String harvest,

        @Size(max = 120, message = "O talhão ou área deve ter no máximo 120 caracteres")
        String fieldName,

        @JsonAlias("plantedAreaHectares")
        @NotNull(message = "A área total prevista é obrigatória")
        @DecimalMin(value = "0.01", message = "A área total prevista deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "A área aceita até 10 inteiros e 2 decimais")
        BigDecimal plannedAreaHectares,

        @DecimalMin(
                value = "0.01",
                message = "A distância entre linhas deve ser maior que zero"
        )
        @DecimalMax(
                value = "1000",
                message = "A distância entre linhas deve ser de no máximo 1000 cm"
        )
        @Digits(
                integer = 4,
                fraction = 2,
                message = "A distância entre linhas aceita até 2 casas decimais"
        )
        BigDecimal rowSpacingCentimeters,

        @JsonAlias("plantingDate")
        @NotNull(message = "A data de início é obrigatória")
        LocalDate startDate,

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
    public PlantingRequest(
            String crop,
            String harvest,
            BigDecimal plannedAreaHectares,
            LocalDate startDate,
            String seedVariety,
            BigDecimal seedQuantity,
            String observations
    ) {
        this(
                crop,
                harvest,
                null,
                plannedAreaHectares,
                null,
                startDate,
                seedVariety,
                seedQuantity,
                observations
        );
    }
}
