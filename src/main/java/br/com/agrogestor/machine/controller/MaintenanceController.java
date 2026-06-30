package br.com.agrogestor.machine.controller;

import br.com.agrogestor.machine.dto.MaintenanceRequest;
import br.com.agrogestor.machine.dto.MaintenanceResponse;
import br.com.agrogestor.machine.service.MachineService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/maintenances")
public class MaintenanceController {

    private final MachineService service;

    public MaintenanceController(MachineService service) {
        this.service = service;
    }

    @PutMapping("/{id}")
    public MaintenanceResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody MaintenanceRequest request
    ) {
        return service.updateMaintenance(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.deleteMaintenance(id);
    }
}
