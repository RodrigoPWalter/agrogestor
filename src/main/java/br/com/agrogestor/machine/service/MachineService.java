package br.com.agrogestor.machine.service;

import br.com.agrogestor.machine.dto.MachineRequest;
import br.com.agrogestor.machine.dto.MachineResponse;
import br.com.agrogestor.machine.dto.MaintenanceRequest;
import br.com.agrogestor.machine.dto.MaintenanceResponse;
import br.com.agrogestor.machine.entity.Machine;
import br.com.agrogestor.machine.entity.Maintenance;
import br.com.agrogestor.machine.repository.MachineRepository;
import br.com.agrogestor.machine.repository.MaintenanceRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class MachineService {
    private final MachineRepository machineRepository;
    private final MaintenanceRepository maintenanceRepository;

    public MachineService(
            MachineRepository machineRepository,
            MaintenanceRepository maintenanceRepository
    ) {
        this.machineRepository = machineRepository;
        this.maintenanceRepository = maintenanceRepository;
    }

    @Transactional
    public MachineResponse create(MachineRequest request) {
        return toResponse(machineRepository.save(new Machine(
                normalize(request.model()), normalize(request.brand()), request.manufactureYear(),
                hours(request.usageHours())
        )));
    }

    @Transactional(readOnly = true)
    public List<MachineResponse> findAll() {
        return machineRepository.findAll(Sort.by("brand", "model"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MachineResponse findById(UUID id) {
        return toResponse(findMachine(id));
    }

    @Transactional
    public MachineResponse update(UUID id, MachineRequest request) {
        Machine machine = findMachine(id);
        machine.update(normalize(request.model()), normalize(request.brand()),
                request.manufactureYear(), hours(request.usageHours()));
        return toResponse(machine);
    }

    @Transactional
    public void delete(UUID id) {
        machineRepository.delete(findMachine(id));
    }

    @Transactional
    public MaintenanceResponse createMaintenance(UUID machineId, MaintenanceRequest request) {
        Machine machine = findMachine(machineId);
        return toResponse(maintenanceRepository.save(new Maintenance(
                machine, request.maintenanceDate(), request.maintenanceType(),
                normalizeNullable(request.replacedParts()), money(request.cost()),
                request.nextReviewHours() == null ? null : hours(request.nextReviewHours()),
                normalizeNullable(request.notes())
        )));
    }

    @Transactional(readOnly = true)
    public List<MaintenanceResponse> maintenances(UUID machineId) {
        findMachine(machineId);
        return maintenanceRepository.findByMachineIdOrderByMaintenanceDateDesc(machineId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MaintenanceResponse updateMaintenance(UUID id, MaintenanceRequest request) {
        Maintenance maintenance = findMaintenance(id);
        maintenance.update(maintenance.getMachine(), request.maintenanceDate(), request.maintenanceType(),
                normalizeNullable(request.replacedParts()), money(request.cost()),
                request.nextReviewHours() == null ? null : hours(request.nextReviewHours()),
                normalizeNullable(request.notes()));
        return toResponse(maintenance);
    }

    @Transactional
    public void deleteMaintenance(UUID id) {
        maintenanceRepository.delete(findMaintenance(id));
    }

    private Machine findMachine(UUID id) {
        return machineRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Máquina não encontrada com o ID " + id));
    }

    private Maintenance findMaintenance(UUID id) {
        return maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Manutenção não encontrada com o ID " + id
                ));
    }

    private MachineResponse toResponse(Machine machine) {
        BigDecimal nextReview = maintenanceRepository
                .findFirstByMachineIdAndNextReviewHoursIsNotNullOrderByMaintenanceDateDesc(machine.getId())
                .map(Maintenance::getNextReviewHours).orElse(null);
        return new MachineResponse(machine.getId(), machine.getModel(), machine.getBrand(),
                machine.getManufactureYear(), machine.getUsageHours(), nextReview,
                nextReview != null && machine.getUsageHours().compareTo(nextReview) >= 0,
                machine.getCreatedAt(), machine.getUpdatedAt());
    }

    private MaintenanceResponse toResponse(Maintenance maintenance) {
        Machine machine = maintenance.getMachine();
        return new MaintenanceResponse(maintenance.getId(), machine.getId(),
                machine.getBrand() + " " + machine.getModel(), maintenance.getMaintenanceDate(),
                maintenance.getMaintenanceType(), maintenance.getMaintenanceType().getDisplayName(),
                maintenance.getReplacedParts(), maintenance.getCost(), maintenance.getNextReviewHours(),
                maintenance.getNotes(), maintenance.getCreatedAt(), maintenance.getUpdatedAt());
    }

    private BigDecimal hours(BigDecimal value) {
        return value.setScale(1, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }
    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
