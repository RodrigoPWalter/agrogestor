package br.com.agrogestor.seeding.controller;

import br.com.agrogestor.seeding.dto.SeedingEstimateRequest;
import br.com.agrogestor.seeding.dto.SeedingEstimateResponse;
import br.com.agrogestor.seeding.service.SeedingEstimateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/seeding-estimates")
@Tag(name = "Estimativa de semeadura", description = "Cálculo de sementes e plantas por metro")
public class SeedingEstimateController {

    private final SeedingEstimateService service;

    public SeedingEstimateController(SeedingEstimateService service) {
        this.service = service;
    }

    @PostMapping("/calculate")
    @Operation(
            summary = "Calcular a distribuição de sementes",
            description = "Aceita o total de sementes ou o peso usado com o peso de mil sementes"
    )
    public ResponseEntity<SeedingEstimateResponse> calculate(
            @Valid @RequestBody SeedingEstimateRequest request
    ) {
        return ResponseEntity.ok(service.calculate(request));
    }
}
