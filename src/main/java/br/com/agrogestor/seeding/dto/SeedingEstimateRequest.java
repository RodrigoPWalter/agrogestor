package br.com.agrogestor.seeding.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SeedingEstimateRequest(
        @NotNull(message = "A área em hectares é obrigatória")
        @DecimalMin(value = "0.01", message = "A área deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "A área aceita até 10 inteiros e 2 decimais")
        BigDecimal hectares,

        @NotNull(message = "O espaçamento entre linhas é obrigatório")
        @DecimalMin(value = "1.00", message = "O espaçamento deve ser de pelo menos 1 cm")
        @Digits(integer = 3, fraction = 2, message = "O espaçamento aceita até 3 inteiros e 2 decimais")
        BigDecimal rowSpacingCentimeters,

        @DecimalMin(value = "1", message = "O total de sementes deve ser maior que zero")
        @Digits(integer = 15, fraction = 0, message = "O total de sementes deve ser um número inteiro")
        BigDecimal totalSeedCount,

        @DecimalMin(value = "0.001", message = "O peso de sementes deve ser maior que zero")
        @Digits(integer = 10, fraction = 3, message = "O peso aceita até 10 inteiros e 3 decimais")
        BigDecimal totalSeedWeightKilograms,

        @DecimalMin(value = "0.01", message = "O peso de mil sementes deve ser maior que zero")
        @Digits(integer = 6, fraction = 2, message = "O peso de mil sementes aceita até 6 inteiros e 2 decimais")
        BigDecimal thousandSeedWeightGrams,

        @NotNull(message = "O poder germinativo é obrigatório")
        @DecimalMin(value = "0.01", message = "O poder germinativo deve ser maior que zero")
        @DecimalMax(value = "100.00", message = "O poder germinativo não pode ultrapassar 100%")
        BigDecimal germinationPercentage,

        @NotNull(message = "A emergência esperada em campo é obrigatória")
        @DecimalMin(value = "0.01", message = "A emergência esperada deve ser maior que zero")
        @DecimalMax(value = "100.00", message = "A emergência esperada não pode ultrapassar 100%")
        BigDecimal fieldEmergencePercentage
) {

    @AssertTrue(message = "Informe o total de sementes ou o peso usado junto com o peso de mil sementes")
    public boolean isSeedInputValid() {
        boolean usesSeedCount = totalSeedCount != null;
        boolean hasWeight = totalSeedWeightKilograms != null;
        boolean hasThousandSeedWeight = thousandSeedWeightGrams != null;
        boolean usesWeight = hasWeight && hasThousandSeedWeight;
        boolean hasIncompleteWeightInput = hasWeight != hasThousandSeedWeight;

        return !hasIncompleteWeightInput && (usesSeedCount != usesWeight);
    }
}
