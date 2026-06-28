package br.com.agrogestor.production.controller;

import br.com.agrogestor.production.dto.ProductionEstimateRequest;
import br.com.agrogestor.production.dto.ProductionEstimateResponse;
import br.com.agrogestor.production.service.ProductionEstimateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/production-estimates")
@Tag(name = "Estimativa de produção", description = "Cálculo de produção e retorno financeiro")
public class ProductionEstimateController {

    private final ProductionEstimateService service;

    public ProductionEstimateController(ProductionEstimateService service) {
        this.service = service;
    }

    @PostMapping("/calculate")
    @Operation(
            summary = "Calcular uma estimativa de produção",
            description = "Informe o custo total ou o custo por hectare, nunca os dois"
    )
    public ResponseEntity<ProductionEstimateResponse> calculate(
            @Valid @RequestBody ProductionEstimateRequest request
    ) {
        return ResponseEntity.ok(service.calculate(request));
    }
}
