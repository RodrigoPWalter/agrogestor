package br.com.agrogestor.expense.controller;

import br.com.agrogestor.expense.dto.ExpenseRequest;
import br.com.agrogestor.expense.dto.ExpenseResponse;
import br.com.agrogestor.expense.dto.PlantingExpenseSummaryResponse;
import br.com.agrogestor.expense.service.ExpenseService;
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
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/expenses")
@Tag(name = "Gastos", description = "Controle de gastos vinculados aos plantios")
public class ExpenseController {

    private final ExpenseService service;

    public ExpenseController(ExpenseService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Cadastrar um gasto")
    public ResponseEntity<ExpenseResponse> create(@Valid @RequestBody ExpenseRequest request) {
        ExpenseResponse response = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar gastos", description = "Aceita filtro opcional por plantio")
    public ResponseEntity<PageResponse<ExpenseResponse>> findAll(
            @RequestParam(required = false) UUID plantingId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ResponseEntity.ok(service.findAll(plantingId, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar um gasto por ID")
    public ResponseEntity<ExpenseResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar um gasto")
    public ResponseEntity<ExpenseResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody ExpenseRequest request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir um gasto")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @GetMapping("/plantings/{plantingId}/summary")
    @Operation(summary = "Resumir gastos de um plantio por categoria")
    public ResponseEntity<PlantingExpenseSummaryResponse> summarizeByPlanting(
            @PathVariable UUID plantingId
    ) {
        return ResponseEntity.ok(service.summarizeByPlanting(plantingId));
    }
}
