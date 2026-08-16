package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.dto.FieldDiaryResponse;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.entity.FieldDiaryProduct;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.entity.ExpenseOrigin;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.machine.entity.Maintenance;
import br.com.agrogestor.machine.entity.MaintenanceType;
import br.com.agrogestor.machine.repository.MachineRepository;
import br.com.agrogestor.machine.repository.MaintenanceRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.HarvestStep;
import br.com.agrogestor.planting.entity.PlantingStep;
import br.com.agrogestor.planting.repository.HarvestStepRepository;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import br.com.agrogestor.rainfall.repository.RainfallRepository;
import br.com.agrogestor.shared.dto.PageResponse;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FieldDiaryService {

    private final FieldDiaryRepository diaryRepository;
    private final PlantingRepository plantingRepository;
    private final PlantingStepRepository plantingStepRepository;
    private final HarvestStepRepository harvestStepRepository;
    private final FieldDiaryStockService stockService;
    private final RainfallRepository rainfallRepository;
    private final MachineRepository machineRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final ExpenseRepository expenseRepository;
    private final CurrentPropertyService currentProperty;
    private final FieldDiaryResponseMapper responseMapper;

    public FieldDiaryService(
            FieldDiaryRepository diaryRepository,
            PlantingRepository plantingRepository,
            PlantingStepRepository plantingStepRepository,
            HarvestStepRepository harvestStepRepository,
            FieldDiaryStockService stockService,
            RainfallRepository rainfallRepository,
            MachineRepository machineRepository,
            MaintenanceRepository maintenanceRepository,
            ExpenseRepository expenseRepository,
            CurrentPropertyService currentProperty,
            FieldDiaryResponseMapper responseMapper
    ) {
        this.diaryRepository = diaryRepository;
        this.plantingRepository = plantingRepository;
        this.plantingStepRepository = plantingStepRepository;
        this.harvestStepRepository = harvestStepRepository;
        this.stockService = stockService;
        this.rainfallRepository = rainfallRepository;
        this.machineRepository = machineRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.expenseRepository = expenseRepository;
        this.currentProperty = currentProperty;
        this.responseMapper = responseMapper;
    }

    @Transactional
    public FieldDiaryResponse create(FieldDiaryRequest request) {
        validate(request);
        Planting planting = findOptionalPlanting(request.plantingId());
        FieldDiaryEntry entry = new FieldDiaryEntry(
                currentProperty.get(),
                planting,
                request.entryDate(),
                request.activityType(),
                activityDescription(request),
                normalizeNullable(request.weatherCondition()),
                normalizeNullable(request.appliedProducts()),
                normalizeNullable(request.observations())
        );
        updateDetails(entry, request);
        FieldDiaryEntry saved = diaryRepository.save(entry);
        List<FieldDiaryProduct> products = stockService.replaceProducts(saved, request);
        createIntegratedRecords(saved, request, planting, products);
        return responseMapper.toResponse(saved, null, null);
    }

    @Transactional(readOnly = true)
    public PageResponse<FieldDiaryResponse> findAll(UUID plantingId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "entryDate")
                        .and(Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<FieldDiaryEntry> entries = plantingId == null
                ? diaryRepository.findByPropertyId(currentProperty.id(), pageable)
                : diaryRepository.findByPropertyIdAndPlantingId(
                        currentProperty.id(), plantingId, pageable);
        List<UUID> entryIds = entries.getContent().stream()
                .map(FieldDiaryEntry::getId)
                .filter(id -> id != null)
                .toList();
        Map<UUID, PlantingStep> plantingSteps = entryIds.isEmpty()
                ? Map.of()
                : plantingStepRepository.findByDiaryEntryIdIn(entryIds).stream()
                        .collect(Collectors.toMap(
                                PlantingStep::getDiaryEntryId, Function.identity()));
        Map<UUID, HarvestStep> harvestSteps = entryIds.isEmpty()
                ? Map.of()
                : harvestStepRepository.findByDiaryEntryIdIn(entryIds).stream()
                        .collect(Collectors.toMap(
                                HarvestStep::getDiaryEntryId, Function.identity()));
        List<FieldDiaryResponse> content = entries.getContent().stream()
                .map(entry -> responseMapper.toResponse(
                        entry,
                        plantingSteps.get(entry.getId()),
                        harvestSteps.get(entry.getId())))
                .toList();
        return new PageResponse<>(
                content,
                entries.getNumber(),
                entries.getSize(),
                entries.getTotalElements(),
                entries.getTotalPages(),
                entries.isFirst(),
                entries.isLast()
        );
    }

    @Transactional(readOnly = true)
    public FieldDiaryResponse findById(UUID id) {
        FieldDiaryEntry entry = findEntry(id);
        return responseMapper.toResponse(
                entry,
                plantingStepRepository.findByDiaryEntryId(id).orElse(null),
                harvestStepRepository.findByDiaryEntryId(id).orElse(null)
        );
    }

    @Transactional
    public FieldDiaryResponse update(UUID id, FieldDiaryRequest request) {
        validate(request);
        FieldDiaryEntry entry = findEntry(id);
        ensureDirectEntry(entry);
        deleteIntegratedRecords(entry);
        entry.update(
                findOptionalPlanting(request.plantingId()),
                request.entryDate(),
                request.activityType(),
                activityDescription(request),
                normalizeNullable(request.weatherCondition()),
                normalizeNullable(request.appliedProducts()),
                normalizeNullable(request.observations())
        );
        updateDetails(entry, request);
        List<FieldDiaryProduct> products = stockService.replaceProducts(entry, request);
        createIntegratedRecords(entry, request, entry.getPlanting(), products);
        return responseMapper.toResponse(entry, null, null);
    }

    @Transactional
    public void delete(UUID id) {
        FieldDiaryEntry entry = findEntry(id);
        ensureDirectEntry(entry);
        stockService.removeProducts(entry, "Estorno por exclusão no diário: ");
        deleteIntegratedRecords(entry);
        diaryRepository.delete(entry);
    }

    private void validate(FieldDiaryRequest request) {
        ActivityType type = request.activityType();
        if (type == ActivityType.HARVEST && request.plantingId() == null) {
            throw new BusinessRuleException("Selecione o plantio que foi colhido");
        }
        if (type == ActivityType.RAIN
                && (request.rainfallMillimeters() == null
                || request.rainfallMillimeters().signum() <= 0)) {
            throw new BusinessRuleException("Informe uma quantidade de chuva maior que zero");
        }
        if ((type == ActivityType.PRODUCT_PURCHASE || type == ActivityType.PRODUCT_USE)
                && (request.quantity() == null || request.quantity().signum() <= 0)
                && (request.products() == null || request.products().isEmpty())) {
            throw new BusinessRuleException("Informe o produto e a quantidade");
        }
        if (type == ActivityType.PRODUCT_PURCHASE && request.productId() == null
                && (request.productName() == null || request.productName().isBlank())) {
            throw new BusinessRuleException("Selecione um produto ou informe o nome do novo produto");
        }
        if (type == ActivityType.PRODUCT_USE && request.productId() == null
                && (request.products() == null || request.products().isEmpty())) {
            throw new BusinessRuleException("Selecione o produto usado");
        }
        if (type == ActivityType.MAINTENANCE && request.machineId() == null) {
            throw new BusinessRuleException("Selecione a máquina da manutenção");
        }
        if (type == ActivityType.HARVEST
                && (request.harvestQuantity() == null
                || request.harvestQuantity().signum() <= 0
                || request.harvestUnit() == null
                || request.harvestUnit().isBlank())) {
            throw new BusinessRuleException("Informe a quantidade e a unidade da colheita");
        }
    }

    private void createIntegratedRecords(
            FieldDiaryEntry entry,
            FieldDiaryRequest request,
            Planting planting,
            List<FieldDiaryProduct> products
    ) {
        Maintenance maintenance = null;
        if (request.activityType() == ActivityType.RAIN) {
            RainfallMeasurement rainfall = rainfallRepository.save(new RainfallMeasurement(
                    currentProperty.get(),
                    planting, request.entryDate(), request.rainfallMillimeters(),
                    normalizeNullable(request.observations())));
            entry.linkRainfall(rainfall.getId());
        }
        if (request.activityType() == ActivityType.MAINTENANCE) {
            var machine = machineRepository.findByIdAndPropertyId(
                            request.machineId(), currentProperty.id())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Máquina não encontrada com o ID " + request.machineId()));
            maintenance = maintenanceRepository.save(new Maintenance(
                    machine, request.entryDate(), MaintenanceType.CORRECTIVE,
                    activityDescription(request), moneyOrZero(request.amount()), null,
                    normalizeNullable(request.observations())));
            entry.linkMaintenance(maintenance.getId());
        }
        if (request.amount() != null && request.amount().signum() > 0
                && (request.activityType() == ActivityType.PRODUCT_PURCHASE
                || request.activityType() == ActivityType.MAINTENANCE)) {
            ExpenseCategory category = request.activityType() == ActivityType.MAINTENANCE
                    ? ExpenseCategory.MAINTENANCE : productCategory(products, request.productType());
            ExpenseOrigin origin = request.activityType() == ActivityType.MAINTENANCE
                    ? ExpenseOrigin.MAINTENANCE : ExpenseOrigin.DIRECT;
            Expense expense = expenseRepository.save(new Expense(
                    currentProperty.get(),
                    null, activityDescription(request), category, request.amount(),
                    request.entryDate(), normalizeNullable(request.observations()), origin));
            entry.linkExpense(expense.getId());
            if (maintenance != null) {
                maintenance.linkExpense(expense.getId());
            }
        }
        if (request.activityType() == ActivityType.PRODUCT_USE && planting != null) {
            BigDecimal allocatedCost = products.stream()
                    .map(FieldDiaryProduct::getTotalCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (allocatedCost.signum() > 0) {
                Expense expense = expenseRepository.save(new Expense(
                        currentProperty.get(),
                        planting,
                        stockAllocationDescription(products),
                        productCategory(products, null),
                        allocatedCost,
                        request.entryDate(),
                        normalizeNullable(request.observations()),
                        ExpenseOrigin.STOCK_ALLOCATION
                ));
                entry.linkExpense(expense.getId());
            }
        }
    }

    private void deleteIntegratedRecords(FieldDiaryEntry entry) {
        if (entry.getExpenseId() != null) {
            expenseRepository.deleteById(entry.getExpenseId());
        }
        if (entry.getMaintenanceId() != null) {
            maintenanceRepository.deleteById(entry.getMaintenanceId());
        }
        if (entry.getRainfallId() != null) {
            rainfallRepository.deleteById(entry.getRainfallId());
        }
        entry.clearIntegrationLinks();
    }

    private void updateDetails(FieldDiaryEntry entry, FieldDiaryRequest request) {
        entry.updateDetails(
                request.rainfallMillimeters(),
                normalizeNullable(request.supplier()),
                request.amount(),
                request.machineId(),
                request.harvestQuantity(),
                normalizeNullable(request.harvestUnit())
        );
    }

    private FieldDiaryEntry findEntry(UUID id) {
        return diaryRepository.findByIdAndPropertyId(id, currentProperty.id()).orElseThrow(() ->
                new ResourceNotFoundException("Registro do diário não encontrado com o ID " + id));
    }

    private void ensureDirectEntry(FieldDiaryEntry entry) {
        UUID entryId = entry.getId();
        if (plantingStepRepository.findByDiaryEntryId(entryId).isPresent()
                || harvestStepRepository.findByDiaryEntryId(entryId).isPresent()) {
            throw new BusinessRuleException(
                    "Esta etapa pertence ao progresso do plantio. "
                            + "Use a operação de semeadura ou colheita para alterá-la"
            );
        }
    }

    private Planting findOptionalPlanting(UUID id) {
        if (id == null) return null;
        return plantingRepository.findByIdAndPropertyId(id, currentProperty.id()).orElseThrow(() ->
                new ResourceNotFoundException("Plantio não encontrado com o ID " + id));
    }

    private String activityDescription(FieldDiaryRequest request) {
        if (request.activity() != null && !request.activity().isBlank()) {
            return normalize(request.activity());
        }
        return switch (request.activityType()) {
            case RAIN -> "Chuva de " + request.rainfallMillimeters() + " mm";
            case PRODUCT_PURCHASE -> "Compra de produto";
            case PRODUCT_USE -> "Uso de produto";
            case MAINTENANCE -> "Manutenção de máquina";
            case OBSERVATION -> "Observação da propriedade";
            case HARVEST -> "Colheita";
            default -> request.activityType().getDisplayName();
        };
    }

    private ExpenseCategory productExpenseCategory(ProductType type) {
        if (type == null) return ExpenseCategory.OTHER;
        return switch (type) {
            case SEED -> ExpenseCategory.SEEDS;
            case FERTILIZER -> ExpenseCategory.FERTILIZERS;
            case PESTICIDE -> ExpenseCategory.PESTICIDES;
        };
    }

    private ExpenseCategory productCategory(
            List<FieldDiaryProduct> products,
            ProductType fallback
    ) {
        List<ProductType> types = products.stream()
                .map(item -> item.getProduct().getProductType())
                .distinct()
                .toList();
        return types.size() == 1
                ? productExpenseCategory(types.getFirst())
                : productExpenseCategory(fallback);
    }

    private String stockAllocationDescription(List<FieldDiaryProduct> products) {
        String names = products.stream()
                .map(item -> item.getProduct().getName())
                .distinct()
                .collect(Collectors.joining(", "));
        return "Uso de estoque: " + names;
    }

    private BigDecimal moneyOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }
}
