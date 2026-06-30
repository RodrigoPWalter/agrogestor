package br.com.agrogestor.machine.controller;

import br.com.agrogestor.machine.dto.MachineRequest;
import br.com.agrogestor.machine.dto.MachineResponse;
import br.com.agrogestor.machine.dto.MaintenanceRequest;
import br.com.agrogestor.machine.dto.MaintenanceResponse;
import br.com.agrogestor.machine.service.MachineService;
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
@RequestMapping("/api/v1/machines")
@Tag(name = "Máquinas", description = "Maquinário e manutenções")
public class MachineController {

    private final MachineService service;

    public MachineController(MachineService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MachineResponse> create(@Valid @RequestBody MachineRequest request) {
        var response = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri();
        return ResponseEntity.created(location).body(response);
    }
    @GetMapping
    public List<MachineResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public MachineResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public MachineResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody MachineRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @PostMapping("/{id}/maintenances")
    public ResponseEntity<MaintenanceResponse> createMaintenance(
            @PathVariable UUID id,
            @Valid @RequestBody MaintenanceRequest request
    ) {
        MaintenanceResponse response = service.createMaintenance(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/maintenances")
    public List<MaintenanceResponse> maintenances(@PathVariable UUID id) {
        return service.maintenances(id);
    }
}
