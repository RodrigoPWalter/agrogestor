package br.com.agrogestor.inventory.controller;

import br.com.agrogestor.inventory.dto.InventoryMovementRequest;
import br.com.agrogestor.inventory.dto.InventoryMovementResponse;
import br.com.agrogestor.inventory.dto.InventoryProductRequest;
import br.com.agrogestor.inventory.dto.InventoryProductResponse;
import br.com.agrogestor.inventory.dto.InventoryProductUpdateRequest;
import br.com.agrogestor.inventory.service.InventoryService;
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
@RequestMapping("/api/v1/inventory/products")
@Tag(name = "Estoque", description = "Produtos e movimentações de estoque")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Cadastrar produto")
    public ResponseEntity<InventoryProductResponse> create(
            @Valid @RequestBody InventoryProductRequest request) {
        var response = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public List<InventoryProductResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public InventoryProductResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public InventoryProductResponse update(@PathVariable UUID id,
            @Valid @RequestBody InventoryProductUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @PostMapping("/{id}/movements")
    @Operation(summary = "Registrar entrada ou saída")
    public InventoryProductResponse move(@PathVariable UUID id,
            @Valid @RequestBody InventoryMovementRequest request) {
        return service.move(id, request);
    }

    @GetMapping("/{id}/movements")
    public List<InventoryMovementResponse> movements(@PathVariable UUID id) {
        return service.movements(id);
    }
}
