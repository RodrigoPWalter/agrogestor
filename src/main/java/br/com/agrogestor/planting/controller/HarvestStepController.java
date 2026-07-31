package br.com.agrogestor.planting.controller;

import br.com.agrogestor.planting.dto.HarvestStepRequest;
import br.com.agrogestor.planting.dto.HarvestStepResponse;
import br.com.agrogestor.planting.service.HarvestStepService;
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
@RequestMapping("/api/v1/plantings/{plantingId}/harvest-steps")
@Tag(name = "Etapas de colheita", description = "Progresso diário da colheita")
public class HarvestStepController {

    private final HarvestStepService service;

    public HarvestStepController(HarvestStepService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Registrar uma etapa de colheita")
    public ResponseEntity<HarvestStepResponse> create(
            @PathVariable UUID plantingId,
            @Valid @RequestBody HarvestStepRequest request
    ) {
        HarvestStepResponse response = service.create(plantingId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{stepId}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar as etapas de colheita do plantio")
    public List<HarvestStepResponse> findAll(@PathVariable UUID plantingId) {
        return service.findAll(plantingId);
    }

    @GetMapping("/{stepId}")
    @Operation(summary = "Buscar uma etapa de colheita")
    public HarvestStepResponse findById(
            @PathVariable UUID plantingId,
            @PathVariable UUID stepId
    ) {
        return service.findById(plantingId, stepId);
    }

    @PutMapping("/{stepId}")
    @Operation(summary = "Atualizar uma etapa de colheita")
    public HarvestStepResponse update(
            @PathVariable UUID plantingId,
            @PathVariable UUID stepId,
            @Valid @RequestBody HarvestStepRequest request
    ) {
        return service.update(plantingId, stepId, request);
    }

    @DeleteMapping("/{stepId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir uma etapa de colheita")
    public void delete(
            @PathVariable UUID plantingId,
            @PathVariable UUID stepId
    ) {
        service.delete(plantingId, stepId);
    }
}
