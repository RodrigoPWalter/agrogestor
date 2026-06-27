package br.com.agrogestor.planting.controller;

import br.com.agrogestor.planting.dto.PlantingRequest;
import br.com.agrogestor.planting.dto.PlantingResponse;
import br.com.agrogestor.planting.service.PlantingService;
import br.com.agrogestor.shared.dto.PageResponse;
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
import java.util.List;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/plantings")
@Tag(name = "Plantios", description = "Cadastro e consulta do histórico de plantios")
public class PlantingController {

    private final PlantingService service;

    public PlantingController(PlantingService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Cadastrar um plantio")
    public ResponseEntity<PlantingResponse> create(@Valid @RequestBody PlantingRequest request) {
        PlantingResponse response = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar plantios", description = "Aceita filtro opcional por safra e paginação")
    public ResponseEntity<PageResponse<PlantingResponse>> findAll(
            @RequestParam(required = false) String harvest,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ResponseEntity.ok(service.findAll(harvest, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar um plantio por ID")
    public ResponseEntity<PlantingResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar um plantio")
    public ResponseEntity<PlantingResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PlantingRequest request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir um plantio")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @GetMapping("/harvests")
    @Operation(summary = "Consultar o histórico de safras cadastradas")
    public ResponseEntity<List<String>> findHarvestHistory() {
        return ResponseEntity.ok(service.findHarvestHistory());
    }
}
