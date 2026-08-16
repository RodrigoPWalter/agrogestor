package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.dto.FieldDiaryProductRequest;
import br.com.agrogestor.diary.entity.ActivityType;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.entity.FieldDiaryProduct;
import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.diary.repository.FieldDiaryProductRepository;
import br.com.agrogestor.inventory.entity.InventoryMovement;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.MovementType;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.inventory.repository.InventoryMovementRepository;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStep;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import br.com.agrogestor.planting.repository.HarvestStepRepository;
import br.com.agrogestor.shared.exception.ResourceNotFoundException;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.rainfall.repository.RainfallRepository;
import br.com.agrogestor.machine.repository.MachineRepository;
import br.com.agrogestor.machine.repository.MaintenanceRepository;
import br.com.agrogestor.machine.entity.Machine;
import br.com.agrogestor.machine.entity.Maintenance;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseOrigin;
import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FieldDiaryServiceTest {

    private static final UUID PROPERTY_ID = UUID.randomUUID();
    private final Property property = new Property("Teste");

    private FieldDiaryRepository diaryRepository;
    private PlantingRepository plantingRepository;
    private PlantingStepRepository plantingStepRepository;
    private HarvestStepRepository harvestStepRepository;
    private FieldDiaryProductRepository diaryProductRepository;
    private InventoryProductRepository inventoryRepository;
    private InventoryMovementRepository movementRepository;
    private RainfallRepository rainfallRepository;
    private MachineRepository machineRepository;
    private MaintenanceRepository maintenanceRepository;
    private ExpenseRepository expenseRepository;
    private CurrentPropertyService currentProperty;
    private FieldDiaryService service;

    @BeforeEach
    void setUp() {
        diaryRepository = mock(FieldDiaryRepository.class);
        plantingRepository = mock(PlantingRepository.class);
        plantingStepRepository = mock(PlantingStepRepository.class);
        harvestStepRepository = mock(HarvestStepRepository.class);
        diaryProductRepository = mock(FieldDiaryProductRepository.class);
        inventoryRepository = mock(InventoryProductRepository.class);
        movementRepository = mock(InventoryMovementRepository.class);
        rainfallRepository = mock(RainfallRepository.class);
        machineRepository = mock(MachineRepository.class);
        maintenanceRepository = mock(MaintenanceRepository.class);
        expenseRepository = mock(ExpenseRepository.class);
        currentProperty = mock(CurrentPropertyService.class);
        when(currentProperty.id()).thenReturn(PROPERTY_ID);
        when(currentProperty.get()).thenReturn(property);
        FieldDiaryStockService stockService = new FieldDiaryStockService(
                diaryProductRepository,
                inventoryRepository,
                movementRepository,
                currentProperty
        );
        service = new FieldDiaryService(
                diaryRepository,
                plantingRepository,
                plantingStepRepository,
                harvestStepRepository,
                stockService,
                rainfallRepository,
                machineRepository,
                maintenanceRepository,
                expenseRepository,
                currentProperty,
                new FieldDiaryResponseMapper(diaryProductRepository)
        );
    }

    @Test
    void shouldNormalizeTextWhenCreatingEntry() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.of(planting()));
        when(diaryRepository.save(any(FieldDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(request(plantingId, "  Aplicação   de fungicida  "));

        ArgumentCaptor<FieldDiaryEntry> captor =
                ArgumentCaptor.forClass(FieldDiaryEntry.class);
        verify(diaryRepository).save(captor.capture());
        assertThat(captor.getValue().getActivity()).isEqualTo("Aplicação de fungicida");
    }

    @Test
    void shouldRejectUnknownPlanting() {
        UUID plantingId = UUID.randomUUID();
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(request(plantingId, "Vistoria")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Plantio não encontrado");
    }

    @Test
    void shouldDeductAppliedProductFromInventory() {
        UUID plantingId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product(productId, "10.000");
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.of(planting()));
        when(inventoryRepository.findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID))
                .thenReturn(Optional.of(product));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });

        service.create(requestWithProduct(plantingId, productId, "3.250"));

        assertThat(product.getQuantity()).isEqualByComparingTo("6.750");
        ArgumentCaptor<InventoryMovement> movement =
                ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movement.capture());
        assertThat(movement.getValue().getMovementType()).isEqualTo(MovementType.EXIT);
        assertThat(movement.getValue().getQuantity()).isEqualByComparingTo("3.250");
    }

    @Test
    void shouldRejectApplicationAboveAvailableStock() {
        UUID plantingId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product(productId, "2.000");
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.of(planting()));
        when(inventoryRepository.findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID))
                .thenReturn(Optional.of(product));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });

        assertThatThrownBy(() ->
                service.create(requestWithProduct(plantingId, productId, "3.000")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("estoque disponível");
        assertThat(product.getQuantity()).isEqualByComparingTo("2.000");
    }

    @Test
    void shouldRestoreStockWhenDeletingDiaryEntry() {
        UUID entryId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product(productId, "7.000");
        FieldDiaryEntry entry = new FieldDiaryEntry(
                property, planting(), LocalDate.now(), ActivityType.APPLICATION,
                "Aplicação de adubo", null, null, null);
        ReflectionTestUtils.setField(entry, "id", entryId);
        when(diaryRepository.findByIdAndPropertyId(entryId, PROPERTY_ID)).thenReturn(Optional.of(entry));
        when(diaryProductRepository.findByEntryId(entryId))
                .thenReturn(List.of(new FieldDiaryProduct(
                        entry, product, new BigDecimal("3.000"))));
        when(inventoryRepository.findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID))
                .thenReturn(Optional.of(product));

        service.delete(entryId);

        assertThat(product.getQuantity()).isEqualByComparingTo("10.000");
        ArgumentCaptor<InventoryMovement> movement =
                ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movement.capture());
        assertThat(movement.getValue().getMovementType()).isEqualTo(MovementType.ENTRY);
    }

    @Test
    void shouldAddPurchasedProductToInventory() {
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product(productId, "2.000");
        when(inventoryRepository.findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID))
                .thenReturn(Optional.of(product));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });

        service.create(new FieldDiaryRequest(
                null, LocalDate.now(), ActivityType.PRODUCT_PURCHASE, null,
                null, null, null, "Compra na cooperativa",
                null, productId, null, null, new BigDecimal("3.000"),
                null, "Cotricampo", null, null, null, null));

        assertThat(product.getQuantity()).isEqualByComparingTo("5.000");
        ArgumentCaptor<InventoryMovement> movement =
                ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movement.capture());
        assertThat(movement.getValue().getMovementType()).isEqualTo(MovementType.ENTRY);
    }

    @Test
    void shouldKeepPurchaseAsPropertyExpenseAndValueTheStock() {
        UUID plantingId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        InventoryProduct product = product(productId, "0.000");
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting()));
        when(inventoryRepository.findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID))
                .thenReturn(Optional.of(product));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            ReflectionTestUtils.setField(expense, "id", UUID.randomUUID());
            return expense;
        });

        service.create(new FieldDiaryRequest(
                plantingId, LocalDate.now(), ActivityType.PRODUCT_PURCHASE, null,
                null, null, null, "Compra na cooperativa",
                null, productId, null, null, new BigDecimal("3.000"),
                null, "Cotricampo", new BigDecimal("15000.00"),
                null, null, null));

        assertThat(product.getQuantity()).isEqualByComparingTo("3.000");
        assertThat(product.getInventoryValue()).isEqualByComparingTo("15000.00");
        assertThat(product.getAverageUnitCost()).isEqualByComparingTo("5000.000000");
        ArgumentCaptor<Expense> expense = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(expense.capture());
        assertThat(expense.getValue().getOrigin()).isEqualTo(ExpenseOrigin.DIRECT);
        assertThat(expense.getValue().getPlanting()).isNull();
    }

    @Test
    void shouldTransferUsedStockCostToPlantingWithoutNewPropertyExpense() {
        UUID plantingId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        Planting planting = planting();
        InventoryProduct product = product(productId, "0.000");
        product.applyEntry(new BigDecimal("3.000"), new BigDecimal("15000.00"));
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting));
        when(inventoryRepository.findByIdAndPropertyIdForUpdate(productId, PROPERTY_ID))
                .thenReturn(Optional.of(product));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            ReflectionTestUtils.setField(expense, "id", UUID.randomUUID());
            return expense;
        });

        service.create(new FieldDiaryRequest(
                plantingId, LocalDate.now(), ActivityType.PRODUCT_USE, null,
                null, null, null, "Adubação do talhão",
                null, productId, null, null, new BigDecimal("1.000"),
                null, null, null, null, null, null));

        assertThat(product.getQuantity()).isEqualByComparingTo("2.000");
        assertThat(product.getInventoryValue()).isEqualByComparingTo("10000.00");
        ArgumentCaptor<Expense> expense = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(expense.capture());
        assertThat(expense.getValue().getOrigin())
                .isEqualTo(ExpenseOrigin.STOCK_ALLOCATION);
        assertThat(expense.getValue().getAmount()).isEqualByComparingTo("5000.00");
        assertThat(expense.getValue().getPlanting()).isSameAs(planting);
    }

    @Test
    void shouldCreateRainfallFromDiaryWithoutPlanting() {
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });
        when(rainfallRepository.save(any(RainfallMeasurement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new FieldDiaryRequest(
                null, LocalDate.now(), ActivityType.RAIN, null,
                null, null, null, "Chuva da madrugada",
                new BigDecimal("24.50"), null, null, null, null,
                null, null, null, null, null, null));

        ArgumentCaptor<RainfallMeasurement> rainfall =
                ArgumentCaptor.forClass(RainfallMeasurement.class);
        verify(rainfallRepository).save(rainfall.capture());
        assertThat(rainfall.getValue().getMillimeters()).isEqualByComparingTo("24.50");
        assertThat(rainfall.getValue().getPlanting()).isNull();
    }

    @Test
    void shouldLinkDiaryMaintenanceToPropertyExpense() {
        UUID machineId = UUID.randomUUID();
        UUID maintenanceId = UUID.randomUUID();
        UUID expenseId = UUID.randomUUID();
        Machine machine = new Machine(
                property, "6110J", "John Deere", 2020, new BigDecimal("100.0"));
        ReflectionTestUtils.setField(machine, "id", machineId);
        when(machineRepository.findByIdAndPropertyId(machineId, PROPERTY_ID))
                .thenReturn(Optional.of(machine));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });
        when(maintenanceRepository.save(any(Maintenance.class))).thenAnswer(invocation -> {
            Maintenance maintenance = invocation.getArgument(0);
            ReflectionTestUtils.setField(maintenance, "id", maintenanceId);
            return maintenance;
        });
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            ReflectionTestUtils.setField(expense, "id", expenseId);
            return expense;
        });

        service.create(new FieldDiaryRequest(
                null, LocalDate.now(), ActivityType.MAINTENANCE,
                "Troca de filtro", null, null, null,
                "Revisão da máquina", null, null, null, null,
                null, null, null, new BigDecimal("200.00"), machineId,
                null, null));

        ArgumentCaptor<Maintenance> maintenance =
                ArgumentCaptor.forClass(Maintenance.class);
        verify(maintenanceRepository).save(maintenance.capture());
        assertThat(maintenance.getValue().getExpenseId()).isEqualTo(expenseId);

        ArgumentCaptor<Expense> expense = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(expense.capture());
        assertThat(expense.getValue().getOrigin()).isEqualTo(ExpenseOrigin.MAINTENANCE);
        assertThat(expense.getValue().getPlanting()).isNull();
        assertThat(expense.getValue().getAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    void shouldExposePlantingStepDetailsInDiaryResponse() {
        UUID entryId = UUID.randomUUID();
        UUID stepId = UUID.randomUUID();
        Planting planting = planting();
        FieldDiaryEntry entry = new FieldDiaryEntry(
                property,
                planting,
                LocalDate.of(2026, 8, 12),
                ActivityType.PLANTING,
                "Plantio realizado: 5 hectares plantados",
                null,
                null,
                "Primeira etapa"
        );
        ReflectionTestUtils.setField(entry, "id", entryId);
        PlantingStep step = new PlantingStep(
                planting,
                LocalDate.of(2026, 8, 12),
                new BigDecimal("5.00"),
                "AG 8700",
                null,
                null,
                "Primeira etapa"
        );
        ReflectionTestUtils.setField(step, "id", stepId);
        step.linkDiaryEntry(entryId);
        when(diaryRepository.findByIdAndPropertyId(entryId, PROPERTY_ID))
                .thenReturn(Optional.of(entry));
        when(plantingStepRepository.findByDiaryEntryId(entryId))
                .thenReturn(Optional.of(step));

        var response = service.findById(entryId);

        assertThat(response.operationStepId()).isEqualTo(stepId);
        assertThat(response.operationAreaHectares()).isEqualByComparingTo("5.00");
        assertThat(response.operationSeedVariety()).isEqualTo("AG 8700");
    }

    @Test
    void shouldRequireStepEndpointForManagedDiaryEntry() {
        UUID entryId = UUID.randomUUID();
        Planting planting = planting();
        FieldDiaryEntry entry = new FieldDiaryEntry(
                property,
                planting,
                LocalDate.of(2026, 8, 12),
                ActivityType.PLANTING,
                "Plantio realizado",
                null,
                null,
                null
        );
        ReflectionTestUtils.setField(entry, "id", entryId);
        PlantingStep step = new PlantingStep(
                planting,
                LocalDate.of(2026, 8, 12),
                BigDecimal.ONE,
                "AG 8700",
                null,
                null,
                null
        );
        step.linkDiaryEntry(entryId);
        when(diaryRepository.findByIdAndPropertyId(entryId, PROPERTY_ID))
                .thenReturn(Optional.of(entry));
        when(plantingStepRepository.findByDiaryEntryId(entryId))
                .thenReturn(Optional.of(step));

        assertThatThrownBy(() -> service.delete(entryId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("operação de semeadura ou colheita");
        verify(diaryRepository, never()).delete(any(FieldDiaryEntry.class));
    }

    private FieldDiaryRequest request(UUID plantingId, String activity) {
        return new FieldDiaryRequest(
                plantingId,
                LocalDate.now(),
                ActivityType.APPLICATION,
                activity,
                "Nublado",
                "Fungicida",
                null,
                null
        );
    }

    private FieldDiaryRequest requestWithProduct(
            UUID plantingId,
            UUID productId,
            String quantity
    ) {
        return new FieldDiaryRequest(
                plantingId,
                LocalDate.now(),
                ActivityType.APPLICATION,
                "Aplicação de adubo",
                "Seco",
                null,
                List.of(new FieldDiaryProductRequest(
                        productId, new BigDecimal(quantity))),
                null
        );
    }

    private InventoryProduct product(UUID id, String quantity) {
        InventoryProduct product = new InventoryProduct(
                property, "Adubo", ProductType.FERTILIZER, new BigDecimal(quantity),
                MeasurementUnit.KILOGRAM, BigDecimal.ONE, null);
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    private Planting planting() {
        return new Planting(
                property,
                "Soja",
                "2026/2027",
                new BigDecimal("18.50"),
                LocalDate.of(2026, 7, 1),
                "BRS 284",
                new BigDecimal("50"),
                SeedRateUnit.KILOGRAMS_PER_HECTARE,
                null
        );
    }
}
