package br.com.agrogestor.task.controller;

import br.com.agrogestor.shared.dto.PageResponse;
import br.com.agrogestor.task.dto.FarmTaskRequest;
import br.com.agrogestor.task.dto.FarmTaskResponse;
import br.com.agrogestor.task.dto.FarmTaskStatusRequest;
import br.com.agrogestor.task.entity.FarmTaskStatus;
import br.com.agrogestor.task.service.FarmTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tarefas", description = "Planejamento de tarefas da propriedade")
public class FarmTaskController {

    private final FarmTaskService service;

    public FarmTaskController(FarmTaskService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Cadastrar uma tarefa")
    public ResponseEntity<FarmTaskResponse> create(
            @Valid @RequestBody FarmTaskRequest request
    ) {
        FarmTaskResponse response = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar tarefas da propriedade")
    public PageResponse<FarmTaskResponse> findAll(
            @RequestParam(required = false) FarmTaskStatus status,
            @RequestParam(defaultValue = "false") boolean openOnly,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size
    ) {
        return service.findAll(status, openOnly, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar uma tarefa")
    public FarmTaskResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar uma tarefa")
    public FarmTaskResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody FarmTaskRequest request
    ) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Alterar o andamento de uma tarefa")
    public FarmTaskResponse changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody FarmTaskStatusRequest request
    ) {
        return service.changeStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir uma tarefa")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
