package br.com.agrogestor.dashboard.controller;

import br.com.agrogestor.dashboard.dto.DashboardSummaryResponse;
import br.com.agrogestor.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Visão geral", description = "Resumo operacional da propriedade")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Consultar os indicadores e registros recentes")
    public DashboardSummaryResponse summarize() {
        return service.summarize();
    }
}
