package br.com.agrogestor.quotation.controller;

import br.com.agrogestor.quotation.dto.CommodityQuotesResponse;
import br.com.agrogestor.quotation.service.CommodityQuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/commodity-quotes")
@Tag(name = "Cotações", description = "Cotações agrícolas publicadas pela Cotricampo")
public class CommodityQuoteController {

    private final CommodityQuoteService service;

    public CommodityQuoteController(CommodityQuoteService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Consultar as cotações mais recentes de soja, milho e trigo")
    public ResponseEntity<CommodityQuotesResponse> findLatest() {
        return ResponseEntity.ok(service.findLatest());
    }
}
