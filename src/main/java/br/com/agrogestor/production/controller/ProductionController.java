package br.com.agrogestor.production.controller;

import br.com.agrogestor.production.dto.ProductionSaleRequest;
import br.com.agrogestor.production.dto.ProductionSaleResponse;
import br.com.agrogestor.production.dto.ProductionStockResponse;
import br.com.agrogestor.production.service.ProductionService;
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
@RequestMapping("/api/v1")
@Tag(name = "Produção", description = "Estoque colhido e vendas da produção")
public class ProductionController {

    private final ProductionService service;

    public ProductionController(ProductionService service) {
        this.service = service;
    }

    @GetMapping("/production/stock")
    @Operation(summary = "Consultar estoque de produção da propriedade")
    public List<ProductionStockResponse> findProductionStock() {
        return service.findProductionStock();
    }

    @GetMapping("/plantings/{plantingId}/production-stock")
    @Operation(summary = "Consultar saldo de produção de um plantio")
    public ProductionStockResponse stockForPlanting(@PathVariable UUID plantingId) {
        return service.stockForPlanting(plantingId);
    }

    @PostMapping("/plantings/{plantingId}/sales")
    @Operation(summary = "Registrar uma venda da produção")
    public ResponseEntity<ProductionSaleResponse> createSale(
            @PathVariable UUID plantingId,
            @Valid @RequestBody ProductionSaleRequest request
    ) {
        ProductionSaleResponse response = service.createSale(plantingId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{saleId}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/plantings/{plantingId}/sales")
    @Operation(summary = "Listar vendas de um plantio")
    public List<ProductionSaleResponse> findSales(@PathVariable UUID plantingId) {
        return service.findSales(plantingId);
    }

    @GetMapping("/plantings/{plantingId}/sales/{saleId}")
    @Operation(summary = "Buscar uma venda do plantio")
    public ProductionSaleResponse findSale(
            @PathVariable UUID plantingId,
            @PathVariable UUID saleId
    ) {
        return service.findSale(plantingId, saleId);
    }

    @PutMapping("/plantings/{plantingId}/sales/{saleId}")
    @Operation(summary = "Atualizar uma venda do plantio")
    public ProductionSaleResponse updateSale(
            @PathVariable UUID plantingId,
            @PathVariable UUID saleId,
            @Valid @RequestBody ProductionSaleRequest request
    ) {
        return service.updateSale(plantingId, saleId, request);
    }

    @DeleteMapping("/plantings/{plantingId}/sales/{saleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir uma venda do plantio")
    public void deleteSale(
            @PathVariable UUID plantingId,
            @PathVariable UUID saleId
    ) {
        service.deleteSale(plantingId, saleId);
    }
}
