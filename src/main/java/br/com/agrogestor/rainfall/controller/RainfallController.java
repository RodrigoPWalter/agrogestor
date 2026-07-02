package br.com.agrogestor.rainfall.controller;

import br.com.agrogestor.rainfall.dto.*;
import br.com.agrogestor.rainfall.service.RainfallService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rainfall")
public class RainfallController {
    private final RainfallService service;

    public RainfallController(RainfallService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<RainfallResponse> create(@Valid @RequestBody RainfallRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping
    public List<RainfallResponse> findAll() { return service.findAll(); }

    @GetMapping("/summary")
    public RainfallSummaryResponse summary() { return service.summary(); }

    @PutMapping("/{id}")
    public RainfallResponse update(@PathVariable UUID id,
            @Valid @RequestBody RainfallRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { service.delete(id); }
}
