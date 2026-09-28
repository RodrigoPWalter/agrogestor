package br.com.agrogestor.task.dto;

import br.com.agrogestor.task.entity.FarmTaskStatus;
import jakarta.validation.constraints.NotNull;

public record FarmTaskStatusRequest(
        @NotNull(message = "Informe o novo estado da tarefa")
        FarmTaskStatus status
) {
}
