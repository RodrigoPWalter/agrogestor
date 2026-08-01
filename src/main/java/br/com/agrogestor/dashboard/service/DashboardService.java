package br.com.agrogestor.dashboard.service;

import br.com.agrogestor.dashboard.dto.DashboardExpenseResponse;
import br.com.agrogestor.dashboard.dto.DashboardInventoryProductResponse;
import br.com.agrogestor.dashboard.dto.DashboardMetricsResponse;
import br.com.agrogestor.dashboard.dto.DashboardPlantingResponse;
import br.com.agrogestor.dashboard.dto.DashboardSummaryResponse;
import br.com.agrogestor.expense.entity.Expense;
import br.com.agrogestor.expense.repository.ExpenseRepository;
import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.repository.InventoryProductRepository;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import br.com.agrogestor.planting.repository.PlantingAreaTotalProjection;
import br.com.agrogestor.planting.repository.PlantingRepository;
import br.com.agrogestor.planting.repository.PlantingStepRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final int DASHBOARD_LIST_SIZE = 5;

    private final PlantingRepository plantingRepository;
    private final PlantingStepRepository plantingStepRepository;
    private final ExpenseRepository expenseRepository;
    private final InventoryProductRepository inventoryProductRepository;

    public DashboardService(
            PlantingRepository plantingRepository,
            PlantingStepRepository plantingStepRepository,
            ExpenseRepository expenseRepository,
            InventoryProductRepository inventoryProductRepository
    ) {
        this.plantingRepository = plantingRepository;
        this.plantingStepRepository = plantingStepRepository;
        this.expenseRepository = expenseRepository;
        this.inventoryProductRepository = inventoryProductRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summarize() {
        PlantingStatus activeStatus = PlantingStatus.ACTIVE;
        BigDecimal plantedArea = valueOrZero(
                plantingStepRepository.sumAreaByPlantingStatus(activeStatus)
        );
        BigDecimal plannedArea = valueOrZero(
                plantingRepository.sumPlannedAreaByStatus(activeStatus)
        );
        BigDecimal totalExpenses = valueOrZero(expenseRepository.sumAllAmounts());

        List<Planting> recentPlantings = plantingRepository
                .findByStatusOrderByStartDateDescCropAsc(
                        activeStatus,
                        PageRequest.of(0, DASHBOARD_LIST_SIZE)
                );
        Map<UUID, BigDecimal> plantedAreas = plantedAreas(recentPlantings);

        return new DashboardSummaryResponse(
                new DashboardMetricsResponse(
                        area(plantedArea),
                        area(plannedArea),
                        plantingRepository.countByStatus(activeStatus),
                        money(totalExpenses),
                        expenseRepository.count(),
                        inventoryProductRepository.count(),
                        inventoryProductRepository.countLowStock(),
                        costPerHectare(totalExpenses, plannedArea)
                ),
                recentPlantings.stream()
                        .map(planting -> toResponse(planting, plantedAreas))
                        .toList(),
                expenseRepository
                        .findAllByOrderByExpenseDateDescCreatedAtDesc(
                                PageRequest.of(0, DASHBOARD_LIST_SIZE)
                        )
                        .stream()
                        .map(this::toResponse)
                        .toList(),
                inventoryProductRepository
                        .findForDashboard(PageRequest.of(0, DASHBOARD_LIST_SIZE))
                        .stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    private Map<UUID, BigDecimal> plantedAreas(List<Planting> plantings) {
        if (plantings.isEmpty()) {
            return Map.of();
        }
        return plantingStepRepository
                .sumAreasByPlantingIds(
                        plantings.stream().map(Planting::getId).toList()
                )
                .stream()
                .collect(Collectors.toMap(
                        PlantingAreaTotalProjection::getPlantingId,
                        PlantingAreaTotalProjection::getPlantedArea
                ));
    }

    private DashboardPlantingResponse toResponse(
            Planting planting,
            Map<UUID, BigDecimal> plantedAreas
    ) {
        return new DashboardPlantingResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                area(planting.getPlannedAreaHectares()),
                area(plantedAreas.getOrDefault(planting.getId(), BigDecimal.ZERO)),
                planting.getStartDate(),
                planting.getSeedVariety()
        );
    }

    private DashboardExpenseResponse toResponse(Expense expense) {
        return new DashboardExpenseResponse(
                expense.getId(),
                expense.getDescription(),
                expense.getCategory().getDisplayName(),
                money(expense.getAmount()),
                expense.getExpenseDate()
        );
    }

    private DashboardInventoryProductResponse toResponse(InventoryProduct product) {
        boolean lowStock = product.getQuantity().compareTo(product.getMinimumStock()) <= 0;
        return new DashboardInventoryProductResponse(
                product.getId(),
                product.getName(),
                product.getProductType().getDisplayName(),
                product.getQuantity().setScale(3, RoundingMode.HALF_UP),
                product.getUnit().getDisplayName(),
                product.getExpirationDate(),
                lowStock
        );
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal area(BigDecimal value) {
        return valueOrZero(value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal value) {
        return valueOrZero(value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal costPerHectare(BigDecimal totalExpenses, BigDecimal plannedArea) {
        if (plannedArea.signum() == 0) {
            return money(BigDecimal.ZERO);
        }
        return totalExpenses.divide(plannedArea, 2, RoundingMode.HALF_UP);
    }
}
