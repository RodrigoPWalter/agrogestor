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
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.entity.ExpenseOrigin;
import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import br.com.agrogestor.production.dto.ProductionSaleResponse;
import br.com.agrogestor.production.service.ProductionService;
import br.com.agrogestor.production.service.ProductionBalanceService;
import br.com.agrogestor.production.repository.ProductionSaleRepository;
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
    private ProductionService productionService;
    private ProductionSaleRepository saleRepository;
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
        productionService = mock(ProductionService.class);
        saleRepository = mock(ProductionSaleRepository.class);
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
                new FieldDiaryResponseMapper(diaryProductRepository),
                productionService,
                new ProductionBalanceService(harvestStepRepository, diaryRepository, saleRepository)
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
        when(diaryRepository.findByIdAndPropertyIdForUpdate(entryId, PROPERTY_ID)).thenReturn(Optional.of(entry));
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
        assertThat(expense.getValue().getOrigin()).isEqualTo(ExpenseOrigin.DIARY);
        assertThat(expense.getValue().getPlanting()).isNull();
    }

    @Test
    void shouldCreatePlantingExpenseFromDiary() {
        UUID plantingId = UUID.randomUUID();
        UUID expenseId = UUID.randomUUID();
        Planting planting = planting();
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting));
        when(diaryRepository.save(any(FieldDiaryEntry.class))).thenAnswer(invocation -> {
            FieldDiaryEntry entry = invocation.getArgument(0);
            ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
            return entry;
        });
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            ReflectionTestUtils.setField(expense, "id", expenseId);
            return expense;
        });

        var response = service.create(new FieldDiaryRequest(
                plantingId,
                LocalDate.now(),
                ActivityType.EXPENSE,
                "Óleo diesel",
                null,
                null,
                null,
                "Abastecimento da operação",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                new BigDecimal("850.00"),
                null,
                null,
                null,
                null,
                null,
                null,
                ExpenseCategory.FUEL,
                new BigDecimal("120.500")
        ));

        ArgumentCaptor<Expense> expense = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(expense.capture());
        assertThat(expense.getValue().getOrigin()).isEqualTo(ExpenseOrigin.DIARY);
        assertThat(expense.getValue().getPlanting()).isSameAs(planting);
        assertThat(expense.getValue().getCategory()).isEqualTo(ExpenseCategory.FUEL);
        assertThat(expense.getValue().getAmount()).isEqualByComparingTo("850.00");
        assertThat(expense.getValue().getFuelLiters()).isEqualByComparingTo("120.500");
        assertThat(response.expenseCategory()).isEqualTo(ExpenseCategory.FUEL);
        assertThat(response.fuelLiters()).isEqualByComparingTo("120.500");
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
        when(diaryRepository.findByIdAndPropertyIdForUpdate(entryId, PROPERTY_ID))
                .thenReturn(Optional.of(entry));
        when(plantingStepRepository.findByDiaryEntryId(entryId))
                .thenReturn(Optional.of(step));

        assertThatThrownBy(() -> service.delete(entryId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("operação de semeadura ou colheita");
        verify(diaryRepository, never()).delete(any(FieldDiaryEntry.class));
    }

    @Test
    void shouldCreateProductionSaleFromDiary() {
        UUID plantingId = UUID.randomUUID();
        UUID saleId = UUID.randomUUID();
        Planting planting = planting();
        ReflectionTestUtils.setField(planting, "id", plantingId);
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID))
                .thenReturn(Optional.of(planting));
        when(diaryRepository.save(any(FieldDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(productionService.createSaleFromDiary(
                org.mockito.ArgumentMatchers.eq(plantingId),
                any()
        )).thenReturn(new ProductionSaleResponse(
                saleId,
                plantingId,
                LocalDate.now(),
                new BigDecimal("50.000"),
                new BigDecimal("72.50"),
                new BigDecimal("3625.00"),
                "Cooperativa",
                null,
                null,
                null
        ));

        service.create(new FieldDiaryRequest(
                plantingId,
                LocalDate.now(),
                ActivityType.SALE,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                new BigDecimal("50"),
                new BigDecimal("72.50"),
                "Cooperativa"
        ));

        ArgumentCaptor<FieldDiaryEntry> entry =
                ArgumentCaptor.forClass(FieldDiaryEntry.class);
        verify(diaryRepository).save(entry.capture());
        assertThat(entry.getValue().getProductionSaleId()).isEqualTo(saleId);
        assertThat(entry.getValue().getAmount()).isEqualByComparingTo("3625.00");
        assertThat(entry.getValue().getSupplier()).isEqualTo("Cooperativa");
    }

    @Test
    void shouldPreserveHistoricStockCostAndExpenseOnObservationEdit() {
        UsageFixture fixture = usageFixture();

        service.update(fixture.entry().getId(), usageRequest(fixture, "10", "Texto atualizado"));

        assertThat(fixture.product().getQuantity()).isEqualByComparingTo("190");
        assertThat(fixture.product().getInventoryValue()).isEqualByComparingTo("2900");
        assertThat(fixture.line().getTotalCost()).isEqualByComparingTo("100");
        assertThat(fixture.expense().getAmount()).isEqualByComparingTo("100");
        assertThat(fixture.expense().getObservations()).isEqualTo("Texto atualizado");
        assertThat(fixture.entry().getExpenseId()).isEqualTo(fixture.expense().getId());
        verify(movementRepository, never()).save(any());
        verify(diaryProductRepository, never()).delete(any(FieldDiaryProduct.class));
        verify(diaryProductRepository, never()).save(any());
        verify(expenseRepository, never()).deleteById(any());
        verify(expenseRepository, never()).save(any());
    }

    @Test
    void shouldValueOnlyExtraUsageAtCurrentAverage() {
        UsageFixture fixture = usageFixture();
        service.update(fixture.entry().getId(), usageRequest(fixture, "12", "Mais produto"));
        assertThat(fixture.product().getQuantity()).isEqualByComparingTo("188");
        assertThat(fixture.product().getInventoryValue()).isEqualByComparingTo("2869.47");
        assertThat(fixture.line().getTotalCost()).isEqualByComparingTo("130.53");
        assertThat(fixture.expense().getAmount()).isEqualByComparingTo("130.53");
        ArgumentCaptor<InventoryMovement> movement = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movement.capture());
        assertThat(movement.getValue().getQuantity()).isEqualByComparingTo("2");
        assertThat(movement.getValue().getTotalCost()).isEqualByComparingTo("30.53");
    }

    @Test
    void shouldReturnRecordedCostWhenReducingUsage() {
        UsageFixture fixture = usageFixture();
        service.update(fixture.entry().getId(), usageRequest(fixture, "8", "Menos produto"));
        assertThat(fixture.product().getQuantity()).isEqualByComparingTo("192");
        assertThat(fixture.product().getInventoryValue()).isEqualByComparingTo("2920");
        assertThat(fixture.line().getTotalCost()).isEqualByComparingTo("80");
        assertThat(fixture.expense().getAmount()).isEqualByComparingTo("80");
        ArgumentCaptor<InventoryMovement> movement = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movement.capture());
        assertThat(movement.getValue().getMovementType()).isEqualTo(MovementType.ENTRY);
        assertThat(movement.getValue().getTotalCost()).isEqualByComparingTo("20");
    }

    @Test
    void shouldLeaveOtherProductLinesUntouchedWhenQuantityChanges() {
        UsageFixture fixture = usageFixture();
        InventoryProduct other = product(UUID.randomUUID(), "50");
        FieldDiaryProduct otherLine = new FieldDiaryProduct(fixture.entry(), other,
                new BigDecimal("5"), MovementType.EXIT, new BigDecimal("7"), new BigDecimal("35"));
        when(diaryProductRepository.findByEntryId(fixture.entry().getId()))
                .thenReturn(List.of(fixture.line(), otherLine));
        FieldDiaryRequest request = new FieldDiaryRequest(fixture.entry().getPlanting().getId(),
                LocalDate.now(), ActivityType.PRODUCT_USE, null, null, null,
                List.of(new FieldDiaryProductRequest(fixture.product().getId(), new BigDecimal("12")),
                        new FieldDiaryProductRequest(other.getId(), new BigDecimal("5"))), "Alteração");
        service.update(fixture.entry().getId(), request);
        assertThat(otherLine.getTotalCost()).isEqualByComparingTo("35");
        assertThat(otherLine.getQuantity()).isEqualByComparingTo("5");
        assertThat(fixture.expense().getAmount()).isEqualByComparingTo("165.53");
        verify(inventoryRepository, never()).findByIdAndPropertyIdForUpdate(other.getId(), PROPERTY_ID);
        verify(diaryProductRepository, never()).delete(otherLine);
    }

    @Test
    void shouldRejectAmbiguousProductRepresentationsWithoutMovingStock() {
        UsageFixture fixture = usageFixture();
        FieldDiaryRequest request = new FieldDiaryRequest(fixture.entry().getPlanting().getId(),
                LocalDate.now(), ActivityType.PRODUCT_USE, null, null, null,
                List.of(new FieldDiaryProductRequest(fixture.product().getId(), BigDecimal.TEN)),
                "Texto", null, fixture.product().getId(), null, null, BigDecimal.TEN,
                null, null, null, null, null, null);
        assertThatThrownBy(() -> service.update(fixture.entry().getId(), request))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("apenas um formato");
        assertThat(fixture.product().getQuantity()).isEqualByComparingTo("190");
        verify(movementRepository, never()).save(any());
    }

    @Test
    void shouldRejectDeletingLegacyHarvestAlreadySoldAndPreserveData() {
        FieldDiaryEntry entry = legacyHarvest();
        assertThatThrownBy(() -> service.delete(entry.getId()))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("80 sacas");
        assertThat(entry.getHarvestQuantity()).isEqualByComparingTo("100");
        verify(plantingRepository).findByIdAndPropertyIdForUpdate(entry.getPlanting().getId(), PROPERTY_ID);
        verify(diaryRepository, never()).delete(any());
        verify(diaryProductRepository, never()).deleteByEntryId(any());
    }

    @Test
    void shouldRejectReducingLegacyHarvestBelowSalesAndPreserveData() {
        FieldDiaryEntry entry = legacyHarvest();
        assertThatThrownBy(() -> service.update(entry.getId(), harvestRequest(entry.getPlanting().getId(), "70")))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("80 sacas");
        assertThat(entry.getHarvestQuantity()).isEqualByComparingTo("100");
        assertThat(entry.getObservations()).isEqualTo("Original");
    }

    @Test
    void shouldRejectChangingLegacyHarvestTypeOrPlantingIfAlreadySold() {
        FieldDiaryEntry entry = legacyHarvest();
        assertThatThrownBy(() -> service.update(entry.getId(), request(entry.getPlanting().getId(), "Outro")))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("80 sacas");
        Planting destination = planting();
        UUID destinationId = UUID.randomUUID();
        ReflectionTestUtils.setField(destination, "id", destinationId);
        when(plantingRepository.findByIdAndPropertyIdForUpdate(destinationId, PROPERTY_ID))
                .thenReturn(Optional.of(destination));
        assertThatThrownBy(() -> service.update(entry.getId(), harvestRequest(destinationId, "100")))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("80 sacas");
        assertThat(entry.getActivityType()).isEqualTo(ActivityType.HARVEST);
        assertThat(entry.getPlanting()).isNotSameAs(destination);
    }

    @Test
    void shouldAllowLegacyHarvestEditAtSoldQuantity() {
        FieldDiaryEntry entry = legacyHarvest();
        service.update(entry.getId(), harvestRequest(entry.getPlanting().getId(), "80"));
        assertThat(entry.getHarvestQuantity()).isEqualByComparingTo("80");
        assertThat(entry.getObservations()).isEqualTo("Editada");
    }

    private FieldDiaryEntry legacyHarvest() {
        Planting planting = planting();
        UUID plantingId = UUID.randomUUID();
        ReflectionTestUtils.setField(planting, "id", plantingId);
        FieldDiaryEntry entry = new FieldDiaryEntry(property, planting, LocalDate.now(),
                ActivityType.HARVEST, "Colheita", null, null, "Original");
        ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
        entry.updateDetails(null, null, null, null, new BigDecimal("100"), "sacas", null);
        when(diaryRepository.findByIdAndPropertyIdForUpdate(entry.getId(), PROPERTY_ID)).thenReturn(Optional.of(entry));
        when(plantingRepository.findByIdAndPropertyIdForUpdate(plantingId, PROPERTY_ID)).thenReturn(Optional.of(planting));
        when(plantingRepository.findByIdAndPropertyId(plantingId, PROPERTY_ID)).thenReturn(Optional.of(planting));
        when(diaryRepository.findByPlantingIdAndActivityType(plantingId, ActivityType.HARVEST)).thenReturn(List.of(entry));
        when(saleRepository.sumQuantityByPlantingId(plantingId)).thenReturn(new BigDecimal("80"));
        return entry;
    }

    private FieldDiaryRequest harvestRequest(UUID plantingId, String quantity) {
        return new FieldDiaryRequest(plantingId, LocalDate.now(), ActivityType.HARVEST,
                null, null, null, null, "Editada", null, null, null, null, null,
                null, null, null, null, new BigDecimal(quantity), "sacas");
    }

    private UsageFixture usageFixture() {
        Planting planting = planting();
        ReflectionTestUtils.setField(planting, "id", UUID.randomUUID());
        InventoryProduct product = product(UUID.randomUUID(), "0");
        product.applyEntry(new BigDecimal("100"), new BigDecimal("1000"));
        var cost = product.applyExit(BigDecimal.TEN);
        product.applyEntry(new BigDecimal("100"), new BigDecimal("2000"));
        FieldDiaryEntry entry = new FieldDiaryEntry(property, planting, LocalDate.now(),
                ActivityType.PRODUCT_USE, "Uso", null, null, "Original");
        ReflectionTestUtils.setField(entry, "id", UUID.randomUUID());
        FieldDiaryProduct line = new FieldDiaryProduct(entry, product, BigDecimal.TEN,
                MovementType.EXIT, cost.unitCost(), cost.totalCost());
        Expense expense = new Expense(property, planting, "Uso", ExpenseCategory.FERTILIZERS,
                cost.totalCost(), LocalDate.now(), "Original", ExpenseOrigin.STOCK_ALLOCATION);
        ReflectionTestUtils.setField(expense, "id", UUID.randomUUID());
        entry.linkExpense(expense.getId());
        when(diaryRepository.findByIdAndPropertyIdForUpdate(entry.getId(), PROPERTY_ID)).thenReturn(Optional.of(entry));
        when(plantingRepository.findByIdAndPropertyId(planting.getId(), PROPERTY_ID)).thenReturn(Optional.of(planting));
        when(diaryProductRepository.findByEntryId(entry.getId())).thenReturn(List.of(line));
        when(inventoryRepository.findByIdAndPropertyIdForUpdate(product.getId(), PROPERTY_ID)).thenReturn(Optional.of(product));
        when(expenseRepository.findById(expense.getId())).thenReturn(Optional.of(expense));
        return new UsageFixture(entry, product, line, expense);
    }

    private FieldDiaryRequest usageRequest(UsageFixture fixture, String quantity, String note) {
        return new FieldDiaryRequest(fixture.entry().getPlanting().getId(), LocalDate.now(), ActivityType.PRODUCT_USE,
                null, null, null, null, note, null, fixture.product().getId(), null, null,
                new BigDecimal(quantity), null, null, null, null, null, null);
    }

    private record UsageFixture(FieldDiaryEntry entry, InventoryProduct product, FieldDiaryProduct line, Expense expense) {}

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
