package br.com.agrogestor.machine.service;

import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.entity.ExpenseOrigin;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.machine.dto.MachineRequest;
import br.com.agrogestor.machine.dto.MachineResponse;
import br.com.agrogestor.machine.dto.MachineMaintenanceTotals;
import br.com.agrogestor.machine.dto.MaintenanceRequest;
import br.com.agrogestor.machine.dto.MaintenanceResponse;
import br.com.agrogestor.machine.entity.Machine;
import br.com.agrogestor.machine.entity.Maintenance;
import br.com.agrogestor.machine.entity.MaintenanceType;
import br.com.agrogestor.machine.repository.MachineRepository;
import br.com.agrogestor.machine.repository.MaintenanceRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MachineService {
    private final MachineRepository machineRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final ExpenseRepository expenseRepository;
    private final FieldDiaryRepository diaryRepository;
    private final CurrentPropertyService currentProperty;

    public MachineService(
            MachineRepository machineRepository,
            MaintenanceRepository maintenanceRepository,
            ExpenseRepository expenseRepository,
            FieldDiaryRepository diaryRepository,
            CurrentPropertyService currentProperty
    ) {
        this.machineRepository = machineRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.expenseRepository = expenseRepository;
        this.diaryRepository = diaryRepository;
        this.currentProperty = currentProperty;
    }

    @Transactional
    public MachineResponse create(MachineRequest request) {
        Machine machine = machineRepository.save(new Machine(
                currentProperty.get(),
                normalize(request.model()), normalize(request.brand()), request.manufactureYear(),
                hours(request.usageHours())
        ));
        return toResponse(machine, zeroTotals(machine.getId()));
    }

    @Transactional(readOnly = true)
    public List<MachineResponse> findAll() {
        List<Machine> machines = machineRepository
                .findByPropertyIdOrderByBrandAscModelAsc(currentProperty.id());
        Map<UUID, MachineMaintenanceTotals> totals = maintenanceTotals(machines);
        return machines
                .stream()
                .map(machine -> toResponse(
                        machine,
                        totals.getOrDefault(machine.getId(), zeroTotals(machine.getId()))
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public MachineResponse findById(UUID id) {
        Machine machine = findMachine(id);
        return toResponse(machine, maintenanceTotals(List.of(machine))
                .getOrDefault(id, zeroTotals(id)));
    }

    @Transactional
    public MachineResponse update(UUID id, MachineRequest request) {
        Machine machine = findMachine(id);
        machine.update(normalize(request.model()), normalize(request.brand()),
                request.manufactureYear(), hours(request.usageHours()));
        return toResponse(machine, maintenanceTotals(List.of(machine))
                .getOrDefault(id, zeroTotals(id)));
    }

    @Transactional
    public void delete(UUID id) {
        Machine machine = findMachine(id);
        List<Maintenance> maintenances = maintenanceRepository
                .findByMachineIdOrderByMaintenanceDateDesc(machine.getId());
        Set<UUID> diaryManagedIds = new HashSet<>(
                diaryRepository.findMaintenanceIdsByPropertyId(currentProperty.id()));
        if (maintenances.stream().map(Maintenance::getId).anyMatch(diaryManagedIds::contains)) {
            throw new BusinessRuleException(
                    "Esta máquina possui manutenção registrada pelo Diário. "
                            + "Exclua o acontecimento no Diário antes de excluir a máquina"
            );
        }
        List<UUID> expenseIds = maintenances.stream()
                .map(Maintenance::getExpenseId)
                .filter(expenseId -> expenseId != null)
                .toList();

        machineRepository.delete(machine);
        machineRepository.flush();
        expenseRepository.deleteAllById(expenseIds);
    }

    @Transactional
    public MaintenanceResponse createMaintenance(UUID machineId, MaintenanceRequest request) {
        Machine machine = findMachine(machineId);
        Maintenance maintenance = maintenanceRepository.save(new Maintenance(
                machine, request.maintenanceDate(), request.maintenanceType(),
                normalizeNullable(request.replacedParts()), money(request.cost()),
                request.nextReviewHours() == null ? null : hours(request.nextReviewHours()),
                normalizeNullable(request.notes())
        ));
        syncExpense(maintenance);
        return toResponse(maintenance, false);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceResponse> maintenances(UUID machineId) {
        findMachine(machineId);
        Set<UUID> diaryManagedIds = new HashSet<>(
                diaryRepository.findMaintenanceIdsByPropertyId(currentProperty.id()));
        return maintenanceRepository.findByMachineIdOrderByMaintenanceDateDesc(machineId)
                .stream()
                .map(item -> toResponse(item, diaryManagedIds.contains(item.getId())))
                .toList();
    }

    @Transactional
    public MaintenanceResponse updateMaintenance(UUID id, MaintenanceRequest request) {
        Maintenance maintenance = findMaintenance(id);
        ensureDirectMaintenance(id);
        maintenance.update(maintenance.getMachine(), request.maintenanceDate(), request.maintenanceType(),
                normalizeNullable(request.replacedParts()), money(request.cost()),
                request.nextReviewHours() == null ? null : hours(request.nextReviewHours()),
                normalizeNullable(request.notes()));
        syncExpense(maintenance);
        return toResponse(maintenance, false);
    }

    @Transactional
    public void deleteMaintenance(UUID id) {
        Maintenance maintenance = findMaintenance(id);
        ensureDirectMaintenance(id);
        UUID expenseId = maintenance.getExpenseId();
        maintenanceRepository.delete(maintenance);
        maintenanceRepository.flush();
        if (expenseId != null) {
            expenseRepository.deleteById(expenseId);
        }
    }

    private void syncExpense(Maintenance maintenance) {
        UUID expenseId = maintenance.getExpenseId();
        if (maintenance.getCost().signum() <= 0) {
            if (expenseId != null) {
                maintenance.unlinkExpense();
                maintenanceRepository.flush();
                expenseRepository.deleteById(expenseId);
            }
            return;
        }

        Expense expense = expenseId == null
                ? null
                : expenseRepository.findByIdAndPropertyId(expenseId, currentProperty.id())
                        .orElse(null);
        if (expense == null) {
            expense = expenseRepository.save(new Expense(
                    currentProperty.get(),
                    null,
                    expenseDescription(maintenance),
                    ExpenseCategory.MAINTENANCE,
                    maintenance.getCost(),
                    maintenance.getMaintenanceDate(),
                    expenseNotes(maintenance),
                    ExpenseOrigin.MAINTENANCE
            ));
            maintenance.linkExpense(expense.getId());
            return;
        }

        expense.update(
                null,
                expenseDescription(maintenance),
                ExpenseCategory.MAINTENANCE,
                maintenance.getCost(),
                maintenance.getMaintenanceDate(),
                expenseNotes(maintenance)
        );
    }

    private String expenseDescription(Maintenance maintenance) {
        String description = "Manutenção "
                + maintenance.getMaintenanceType().getDisplayName().toLowerCase(Locale.ROOT)
                + " — " + maintenance.getMachine().getBrand()
                + " " + maintenance.getMachine().getModel();
        return truncate(description, 160);
    }

    private String expenseNotes(Maintenance maintenance) {
        String parts = maintenance.getReplacedParts() == null
                ? null : "Peças: " + maintenance.getReplacedParts();
        String notes = maintenance.getNotes();
        if (parts == null) return notes;
        if (notes == null) return truncate(parts, 1000);
        return truncate(parts + System.lineSeparator() + notes, 1000);
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private Machine findMachine(UUID id) {
        return machineRepository.findByIdAndPropertyId(id, currentProperty.id()).orElseThrow(() ->
                new ResourceNotFoundException("Máquina não encontrada com o ID " + id));
    }

    private Maintenance findMaintenance(UUID id) {
        return maintenanceRepository.findByIdAndMachinePropertyId(id, currentProperty.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Manutenção não encontrada com o ID " + id
                ));
    }

    private void ensureDirectMaintenance(UUID id) {
        if (diaryRepository.existsByPropertyIdAndMaintenanceId(currentProperty.id(), id)) {
            throw new BusinessRuleException(
                    "Esta manutenção foi registrada pelo Diário. "
                            + "Edite ou exclua o acontecimento no Diário"
            );
        }
    }

    private MachineResponse toResponse(
            Machine machine,
            MachineMaintenanceTotals totals
    ) {
        BigDecimal nextReview = maintenanceRepository
                .findFirstByMachineIdAndNextReviewHoursIsNotNullOrderByMaintenanceDateDesc(machine.getId())
                .map(Maintenance::getNextReviewHours).orElse(null);
        return new MachineResponse(machine.getId(), machine.getModel(), machine.getBrand(),
                machine.getManufactureYear(), machine.getUsageHours(), nextReview,
                nextReview != null && machine.getUsageHours().compareTo(nextReview) >= 0,
                money(totals.totalCost()),
                money(totals.preventiveCost()),
                money(totals.correctiveCost()),
                totals.maintenanceCount(),
                totals.preventiveCount(),
                totals.correctiveCount(),
                machine.getCreatedAt(), machine.getUpdatedAt());
    }

    private Map<UUID, MachineMaintenanceTotals> maintenanceTotals(
            List<Machine> machines
    ) {
        if (machines.isEmpty()) return Map.of();
        return maintenanceRepository.summarizeByMachineIds(
                        machines.stream().map(Machine::getId).toList(),
                        MaintenanceType.PREVENTIVE,
                        MaintenanceType.CORRECTIVE
                ).stream()
                .collect(Collectors.toMap(
                        MachineMaintenanceTotals::machineId,
                        totals -> totals
                ));
    }

    private MachineMaintenanceTotals zeroTotals(UUID machineId) {
        return new MachineMaintenanceTotals(
                machineId,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0L,
                0L,
                0L
        );
    }

    private MaintenanceResponse toResponse(Maintenance maintenance, boolean diaryManaged) {
        Machine machine = maintenance.getMachine();
        return new MaintenanceResponse(maintenance.getId(), machine.getId(),
                machine.getBrand() + " " + machine.getModel(), maintenance.getMaintenanceDate(),
                maintenance.getMaintenanceType(), maintenance.getMaintenanceType().getDisplayName(),
                maintenance.getReplacedParts(), maintenance.getCost(), maintenance.getNextReviewHours(),
                maintenance.getNotes(), maintenance.getCreatedAt(), maintenance.getUpdatedAt(),
                diaryManaged);
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
