package br.com.agrogestor.planting.controller;

import br.com.agrogestor.planting.dto.PlantingStepRequest;
import br.com.agrogestor.planting.dto.PlantingStepResponse;
import br.com.agrogestor.planting.service.PlantingStepService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/plantings/{plantingId}/steps")
@Tag(name = "Etapas de plantio", description = "Execução diária da área prevista")
public class PlantingStepController {

    private final PlantingStepService service;

    public PlantingStepController(PlantingStepService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Adicionar hectares e variedade plantados")
    public ResponseEntity<PlantingStepResponse> create(
            @PathVariable UUID plantingId,
            @Valid @RequestBody PlantingStepRequest request
    ) {
        PlantingStepResponse response = service.create(plantingId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{stepId}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar as etapas de um plantio")
    public List<PlantingStepResponse> findAll(@PathVariable UUID plantingId) {
        return service.findAll(plantingId);
    }

    @GetMapping("/{stepId}")
    @Operation(summary = "Buscar uma etapa do plantio")
    public PlantingStepResponse findById(
            @PathVariable UUID plantingId,
            @PathVariable UUID stepId
    ) {
        return service.findById(plantingId, stepId);
    }

    @PutMapping("/{stepId}")
    @Operation(summary = "Editar uma etapa do plantio")
    public PlantingStepResponse update(
            @PathVariable UUID plantingId,
            @PathVariable UUID stepId,
            @Valid @RequestBody PlantingStepRequest request
    ) {
        return service.update(plantingId, stepId, request);
    }

    @DeleteMapping("/{stepId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir uma etapa do plantio")
    public void delete(
            @PathVariable UUID plantingId,
            @PathVariable UUID stepId
    ) {
        service.delete(plantingId, stepId);
    }
}
