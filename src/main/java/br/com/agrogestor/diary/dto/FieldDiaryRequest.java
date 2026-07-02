package br.com.agrogestor.diary.dto;

import br.com.agrogestor.diary.entity.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record FieldDiaryRequest(
        @NotNull(message = "O plantio é obrigatório")
        UUID plantingId,

        @NotNull(message = "A data é obrigatória")
        @PastOrPresent(message = "A data não pode estar no futuro")
        LocalDate entryDate,

        @NotNull(message = "O tipo de atividade é obrigatório")
        ActivityType activityType,

        @NotBlank(message = "A atividade é obrigatória")
        @Size(max = 160, message = "A atividade deve ter no máximo 160 caracteres")
        String activity,

        @Size(max = 120, message = "A condição do tempo deve ter no máximo 120 caracteres")
        String weatherCondition,

        @Size(max = 500, message = "Os produtos devem ter no máximo 500 caracteres")
        String appliedProducts,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String observations
) {
}
