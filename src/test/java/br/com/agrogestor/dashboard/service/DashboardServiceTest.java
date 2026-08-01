package br.com.agrogestor.dashboard.service;

import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.entity.ExpenseCategory;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.ProductType;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.repository.PlantingAreaTotalProjection;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private PlantingRepository plantingRepository;
    @Mock
    private PlantingStepRepository plantingStepRepository;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private InventoryProductRepository inventoryProductRepository;

    private DashboardService service;

    @BeforeEach
    void setUp() {
        service = new DashboardService(
                plantingRepository,
                plantingStepRepository,
                expenseRepository,
                inventoryProductRepository
        );
    }

    @Test
    void summarizesMetricsAndLimitsTheDashboardPayload() {
        UUID plantingId = UUID.randomUUID();
        Planting planting = planting(plantingId);
        Expense expense = expense();
        InventoryProduct product = product();
        PlantingAreaTotalProjection areaProjection = mock(
                PlantingAreaTotalProjection.class
        );

        when(plantingStepRepository.sumAreaByPlantingStatus(PlantingStatus.ACTIVE))
                .thenReturn(new BigDecimal("15"));
        when(plantingRepository.sumPlannedAreaByStatus(PlantingStatus.ACTIVE))
                .thenReturn(new BigDecimal("30"));
        when(expenseRepository.sumAllAmounts()).thenReturn(new BigDecimal("16400"));
        when(plantingRepository.countByStatus(PlantingStatus.ACTIVE)).thenReturn(2L);
        when(expenseRepository.count()).thenReturn(7L);
        when(inventoryProductRepository.count()).thenReturn(4L);
        when(inventoryProductRepository.countLowStock()).thenReturn(1L);
        when(plantingRepository.findByStatusOrderByStartDateDescCropAsc(
                any(PlantingStatus.class),
                any(Pageable.class)
        )).thenReturn(List.of(planting));
        when(areaProjection.getPlantingId()).thenReturn(plantingId);
        when(areaProjection.getPlantedArea()).thenReturn(new BigDecimal("15"));
        when(plantingStepRepository.sumAreasByPlantingIds(anyCollection()))
                .thenReturn(List.of(areaProjection));
        when(expenseRepository.findAllByOrderByExpenseDateDescCreatedAtDesc(
                any(Pageable.class)
        )).thenReturn(List.of(expense));
        when(inventoryProductRepository.findForDashboard(any(Pageable.class)))
                .thenReturn(List.of(product));

        var summary = service.summarize();

        assertThat(summary.metrics().plantedAreaHectares())
                .isEqualByComparingTo("15.00");
        assertThat(summary.metrics().totalExpenses()).isEqualByComparingTo("16400.00");
        assertThat(summary.metrics().costPerHectare()).isEqualByComparingTo("546.67");
        assertThat(summary.metrics().activePlantingsCount()).isEqualTo(2);
        assertThat(summary.metrics().expenseCount()).isEqualTo(7);
        assertThat(summary.metrics().inventoryProductCount()).isEqualTo(4);
        assertThat(summary.metrics().lowStockProductCount()).isEqualTo(1);
        assertThat(summary.recentPlantings()).singleElement()
                .satisfies(item -> {
                    assertThat(item.crop()).isEqualTo("Trigo");
                    assertThat(item.plantedAreaHectares()).isEqualByComparingTo("15.00");
                });
        assertThat(summary.recentExpenses()).singleElement()
                .extracting("categoryDisplayName")
                .isEqualTo("Fertilizantes");
        assertThat(summary.inventoryProducts()).singleElement()
                .satisfies(item -> {
                    assertThat(item.productTypeName()).isEqualTo("Fertilizante");
                    assertThat(item.lowStock()).isTrue();
                });
    }

    @Test
    void returnsZeroCostWhenThereIsNoActiveArea() {
        when(plantingStepRepository.sumAreaByPlantingStatus(PlantingStatus.ACTIVE))
                .thenReturn(null);
        when(plantingRepository.sumPlannedAreaByStatus(PlantingStatus.ACTIVE))
                .thenReturn(BigDecimal.ZERO);
        when(expenseRepository.sumAllAmounts()).thenReturn(new BigDecimal("150"));
        when(plantingRepository.findByStatusOrderByStartDateDescCropAsc(
                any(PlantingStatus.class),
                any(Pageable.class)
        )).thenReturn(List.of());
        when(expenseRepository.findAllByOrderByExpenseDateDescCreatedAtDesc(
                any(Pageable.class)
        )).thenReturn(List.of());
        when(inventoryProductRepository.findForDashboard(any(Pageable.class)))
                .thenReturn(List.of());

        var summary = service.summarize();

        assertThat(summary.metrics().costPerHectare()).isEqualByComparingTo("0.00");
        assertThat(summary.recentPlantings()).isEmpty();
    }

    private Planting planting(UUID id) {
        Planting planting = mock(Planting.class);
        when(planting.getId()).thenReturn(id);
        when(planting.getCrop()).thenReturn("Trigo");
        when(planting.getHarvest()).thenReturn("2026");
        when(planting.getPlannedAreaHectares()).thenReturn(new BigDecimal("30"));
        when(planting.getStartDate()).thenReturn(LocalDate.of(2026, 7, 29));
        when(planting.getSeedVariety()).thenReturn("TBIO Audaz");
        return planting;
    }

    private Expense expense() {
        Expense expense = mock(Expense.class);
        when(expense.getDescription()).thenReturn("Adubo de base");
        when(expense.getCategory()).thenReturn(ExpenseCategory.FERTILIZERS);
        when(expense.getAmount()).thenReturn(new BigDecimal("2500"));
        when(expense.getExpenseDate()).thenReturn(LocalDate.of(2026, 7, 28));
        return expense;
    }

    private InventoryProduct product() {
        InventoryProduct product = mock(InventoryProduct.class);
        when(product.getName()).thenReturn("NPK 10-20-20");
        when(product.getProductType()).thenReturn(ProductType.FERTILIZER);
        when(product.getQuantity()).thenReturn(new BigDecimal("10"));
        when(product.getMinimumStock()).thenReturn(new BigDecimal("15"));
        when(product.getUnit()).thenReturn(MeasurementUnit.KILOGRAM);
        when(product.getExpirationDate()).thenReturn(LocalDate.of(2027, 1, 1));
        return product;
    }
}
