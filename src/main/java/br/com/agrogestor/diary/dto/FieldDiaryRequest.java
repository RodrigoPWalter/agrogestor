package br.com.agrogestor.diary.dto;

import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.ProductType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FieldDiaryRequest(
        UUID plantingId,

        @NotNull(message = "A data é obrigatória")
        @PastOrPresent(message = "A data não pode estar no futuro")
        LocalDate entryDate,

        @NotNull(message = "O tipo de atividade é obrigatório")
        ActivityType activityType,

        @Size(max = 160, message = "A atividade deve ter no máximo 160 caracteres")
        String activity,

        @Size(max = 120, message = "A condição do tempo deve ter no máximo 120 caracteres")
        String weatherCondition,

        @Size(max = 500, message = "Os produtos devem ter no máximo 500 caracteres")
        String appliedProducts,

        List<@Valid FieldDiaryProductRequest> products,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String observations,

        BigDecimal rainfallMillimeters,
        UUID productId,
        String productName,
        ProductType productType,
        BigDecimal quantity,
        MeasurementUnit unit,
        String supplier,
        BigDecimal amount,
        UUID machineId,
        BigDecimal harvestQuantity,
        String harvestUnit
) {
    public FieldDiaryRequest(
            UUID plantingId,
            LocalDate entryDate,
            ActivityType activityType,
            String activity,
            String weatherCondition,
            String appliedProducts,
            List<FieldDiaryProductRequest> products,
            String observations
    ) {
        this(plantingId, entryDate, activityType, activity, weatherCondition,
                appliedProducts, products, observations, null, null, null,
                null, null, null, null, null, null, null, null);
    }
}
