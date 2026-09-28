package br.com.agrogestor.task.dto;

import br.com.agrogestor.task.entity.FarmTaskCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record FarmTaskRequest(
        @NotBlank(message = "Informe o título da tarefa")
        @Size(max = 160, message = "O título deve ter no máximo 160 caracteres")
        String title,

        @NotNull(message = "Informe a categoria da tarefa")
        FarmTaskCategory category,

        @NotNull(message = "Informe o prazo da tarefa")
        LocalDate dueDate,

        @NotNull(message = "Informe o tempo estimado da tarefa")
        @Min(value = 15, message = "O tempo estimado mínimo é de 15 minutos")
        @Max(value = 525600, message = "O tempo estimado deve ser de no máximo um ano")
        Integer estimatedDurationMinutes,

        UUID plantingId,
        UUID machineId,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String notes
) {
}
