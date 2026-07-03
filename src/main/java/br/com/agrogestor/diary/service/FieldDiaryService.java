package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryProductResponse;
import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.dto.FieldDiaryResponse;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.entity.FieldDiaryProduct;
import br.com.agrogestor.diary.repository.FieldDiaryProductRepository;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.MovementType;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.machine.entity.Maintenance;
import br.com.agrogestor.machine.entity.MaintenanceType;
import br.com.agrogestor.machine.repository.MachineRepository;
import br.com.agrogestor.machine.repository.MaintenanceRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import br.com.agrogestor.rainfall.repository.RainfallRepository;
import br.com.agrogestor.shared.dto.PageResponse;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

@Service
public class FieldDiaryService {

    private final FieldDiaryRepository diaryRepository;
    private final PlantingRepository plantingRepository;
    private final FieldDiaryProductRepository diaryProductRepository;
    private final InventoryProductRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final RainfallRepository rainfallRepository;
    private final MachineRepository machineRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final ExpenseRepository expenseRepository;

    @Autowired
    public FieldDiaryService(
            FieldDiaryRepository diaryRepository,
            PlantingRepository plantingRepository,
            FieldDiaryProductRepository diaryProductRepository,
            InventoryProductRepository inventoryRepository,
            InventoryMovementRepository movementRepository,
            RainfallRepository rainfallRepository,
            MachineRepository machineRepository,
            MaintenanceRepository maintenanceRepository,
            ExpenseRepository expenseRepository
    ) {
        this.diaryRepository = diaryRepository;
        this.plantingRepository = plantingRepository;
        this.diaryProductRepository = diaryProductRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.rainfallRepository = rainfallRepository;
        this.machineRepository = machineRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.expenseRepository = expenseRepository;
    }

    FieldDiaryService(
            FieldDiaryRepository diaryRepository,
            PlantingRepository plantingRepository,
            FieldDiaryProductRepository diaryProductRepository,
            InventoryProductRepository inventoryRepository,
            InventoryMovementRepository movementRepository
    ) {
        this(diaryRepository, plantingRepository, diaryProductRepository,
                inventoryRepository, movementRepository, null, null, null, null);
    }

    @Transactional
    public FieldDiaryResponse create(FieldDiaryRequest request) {
        validate(request);
        Planting planting = findOptionalPlanting(request.plantingId());
        FieldDiaryEntry entry = new FieldDiaryEntry(
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
        replaceProducts(saved, request, List.of());
        createIntegratedRecords(saved, request, planting);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<FieldDiaryResponse> findAll(UUID plantingId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "entryDate")
                        .and(Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<FieldDiaryEntry> entries = plantingId == null
                ? diaryRepository.findAll(pageable)
                : diaryRepository.findByPlantingId(plantingId, pageable);
        return PageResponse.from(entries.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public FieldDiaryResponse findById(UUID id) {
        return toResponse(findEntry(id));
    }

    @Transactional
    public FieldDiaryResponse update(UUID id, FieldDiaryRequest request) {
        validate(request);
        FieldDiaryEntry entry = findEntry(id);
        deleteIntegratedRecords(entry);
        List<FieldDiaryProduct> previousProducts =
                diaryProductRepository.findByEntryId(entry.getId());
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
        replaceProducts(entry, request, previousProducts);
        createIntegratedRecords(entry, request, entry.getPlanting());
        return toResponse(entry);
    }

    @Transactional
    public void delete(UUID id) {
        FieldDiaryEntry entry = findEntry(id);
        restoreStock(diaryProductRepository.findByEntryId(entry.getId()), entry,
                "Estorno por exclusão no diário: ");
        diaryProductRepository.deleteByEntryId(entry.getId());
        diaryProductRepository.flush();
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
            Planting planting
    ) {
        if (request.activityType() == ActivityType.RAIN) {
            RainfallMeasurement rainfall = rainfallRepository.save(new RainfallMeasurement(
                    planting, request.entryDate(), request.rainfallMillimeters(),
                    normalizeNullable(request.observations())));
            entry.linkRainfall(rainfall.getId());
        }
        if (request.activityType() == ActivityType.MAINTENANCE) {
            var machine = machineRepository.findById(request.machineId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Máquina não encontrada com o ID " + request.machineId()));
            Maintenance maintenance = maintenanceRepository.save(new Maintenance(
                    machine, request.entryDate(), MaintenanceType.CORRECTIVE,
                    activityDescription(request), moneyOrZero(request.amount()), null,
                    normalizeNullable(request.observations())));
            entry.linkMaintenance(maintenance.getId());
        }
        if (request.amount() != null && request.amount().signum() > 0
                && (request.activityType() == ActivityType.PRODUCT_PURCHASE
                || request.activityType() == ActivityType.MAINTENANCE)) {
            ExpenseCategory category = request.activityType() == ActivityType.MAINTENANCE
                    ? ExpenseCategory.MAINTENANCE : productExpenseCategory(request.productType());
            Expense expense = expenseRepository.save(new Expense(
                    planting, activityDescription(request), category, request.amount(),
                    request.entryDate(), normalizeNullable(request.observations())));
            entry.linkExpense(expense.getId());
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

    private void replaceProducts(
            FieldDiaryEntry entry,
            FieldDiaryRequest request,
            List<FieldDiaryProduct> previousProducts
    ) {
        if (entry.getId() == null) return;
        restoreStock(previousProducts, entry, "Estorno por edição no diário: ");
        diaryProductRepository.deleteByEntryId(entry.getId());
        diaryProductRepository.flush();

        MovementType type = request.activityType() == ActivityType.PRODUCT_PURCHASE
                ? MovementType.ENTRY : MovementType.EXIT;
        var quantities = new LinkedHashMap<UUID, BigDecimal>();
        if (request.products() != null) {
            request.products().forEach(item ->
                    quantities.merge(item.productId(), item.quantity(), BigDecimal::add));
        }
        if (request.productId() != null && request.quantity() != null) {
            quantities.merge(request.productId(), request.quantity(), BigDecimal::add);
        }
        if (request.activityType() == ActivityType.PRODUCT_PURCHASE
                && request.productId() == null && request.quantity() != null) {
            InventoryProduct created = findOrCreateProduct(request);
            quantities.merge(created.getId(), request.quantity(), BigDecimal::add);
        }
        quantities.forEach((productId, quantity) ->
                applyProductMovement(entry, productId, quantity, type));
    }

    private InventoryProduct findOrCreateProduct(FieldDiaryRequest request) {
        String name = normalize(request.productName());
        return inventoryRepository.findFirstByNameIgnoreCase(name).orElseGet(() -> {
            ProductType productType = request.productType() == null
                    ? ProductType.PESTICIDE : request.productType();
            MeasurementUnit unit = request.unit() == null
                    ? MeasurementUnit.UNIT : request.unit();
            return inventoryRepository.save(new InventoryProduct(
                    name, productType, BigDecimal.ZERO, unit, BigDecimal.ZERO, null));
        });
    }

    private void applyProductMovement(
            FieldDiaryEntry entry,
            UUID productId,
            BigDecimal quantity,
            MovementType type
    ) {
        InventoryProduct product = inventoryRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produto não encontrado com o ID " + productId));
        product.applyMovement(type, quantity);
        movementRepository.save(new InventoryMovement(
                product, type, quantity, entry.getEntryDate(),
                entry.getActivityType().getDisplayName() + " pelo diário"));
        diaryProductRepository.save(new FieldDiaryProduct(entry, product, quantity, type));
    }

    private void restoreStock(
            List<FieldDiaryProduct> products,
            FieldDiaryEntry entry,
            String notePrefix
    ) {
        products.stream().filter(FieldDiaryProduct::isStockDeducted).forEach(item -> {
            InventoryProduct product = inventoryRepository
                    .findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Produto não encontrado com o ID " + item.getProduct().getId()));
            MovementType reverse = item.getMovementType() == MovementType.ENTRY
                    ? MovementType.EXIT : MovementType.ENTRY;
            product.applyMovement(reverse, item.getQuantity());
            movementRepository.save(new InventoryMovement(
                    product, reverse, item.getQuantity(), entry.getEntryDate(),
                    notePrefix + entry.getActivity()));
        });
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
        return diaryRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Registro do diário não encontrado com o ID " + id));
    }

    private Planting findOptionalPlanting(UUID id) {
        if (id == null) return null;
        return plantingRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Plantio não encontrado com o ID " + id));
    }

    private FieldDiaryResponse toResponse(FieldDiaryEntry entry) {
        Planting planting = entry.getPlanting();
        List<FieldDiaryProductResponse> products = entry.getId() == null
                ? List.of()
                : diaryProductRepository.findByEntryId(entry.getId()).stream()
                .map(item -> new FieldDiaryProductResponse(
                        item.getProduct().getId(), item.getProduct().getName(),
                        item.getQuantity(), item.getProduct().getUnit().getDisplayName()))
                .toList();
        return new FieldDiaryResponse(
                entry.getId(),
                planting == null ? null : planting.getId(),
                planting == null ? null : planting.getCrop(),
                planting == null ? null : planting.getHarvest(),
                entry.getEntryDate(), entry.getActivityType(),
                entry.getActivityType().getDisplayName(), entry.getActivity(),
                entry.getWeatherCondition(), entry.getAppliedProducts(), products,
                entry.getObservations(), entry.getCreatedAt(), entry.getUpdatedAt(),
                entry.getRainfallMillimeters(), entry.getSupplier(), entry.getAmount(),
                entry.getMachineId(), entry.getHarvestQuantity(), entry.getHarvestUnit());
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
