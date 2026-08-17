package br.com.agrogestor.diary.service;

import br.com.agrogestor.diary.dto.FieldDiaryProductResponse;
import br.com.agrogestor.diary.dto.FieldDiaryResponse;
import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import br.com.agrogestor.diary.repository.FieldDiaryProductRepository;
import br.com.agrogestor.planting.entity.HarvestStep;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStep;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Component
public class FieldDiaryResponseMapper {

    private final FieldDiaryProductRepository productRepository;

    public FieldDiaryResponseMapper(FieldDiaryProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public FieldDiaryResponse toResponse(
            FieldDiaryEntry entry,
            PlantingStep plantingStep,
            HarvestStep harvestStep
    ) {
        Planting planting = entry.getPlanting();
        List<FieldDiaryProductResponse> products = entry.getId() == null
                ? List.of()
                : productRepository.findByEntryId(entry.getId()).stream()
                .map(item -> new FieldDiaryProductResponse(
                        item.getProduct().getId(), item.getProduct().getName(),
                        item.getQuantity(), item.getProduct().getUnit().getDisplayName(),
                        item.getUnitCost(), item.getTotalCost()))
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
                entry.getMachineId(), entry.getHarvestQuantity(), entry.getHarvestUnit(),
                operationId(plantingStep, harvestStep),
                operationArea(plantingStep, harvestStep),
                operationSeedVariety(plantingStep, harvestStep),
                operationStartTime(plantingStep, harvestStep),
                operationEndTime(plantingStep, harvestStep),
                harvestStep == null ? null : harvestStep.getHarvestUnit().name(),
                entry.getProductionSaleId(),
                entry.getSalePricePerBag(),
                entry.getExpenseCategory());
    }

    private UUID operationId(PlantingStep plantingStep, HarvestStep harvestStep) {
        if (plantingStep != null) return plantingStep.getId();
        return harvestStep == null ? null : harvestStep.getId();
    }

    private BigDecimal operationArea(PlantingStep plantingStep, HarvestStep harvestStep) {
        if (plantingStep != null) return plantingStep.getPlantedAreaHectares();
        return harvestStep == null ? null : harvestStep.getHarvestedAreaHectares();
    }

    private String operationSeedVariety(PlantingStep plantingStep, HarvestStep harvestStep) {
        if (plantingStep != null) return plantingStep.getSeedVariety();
        return harvestStep == null ? null : harvestStep.getSeedVariety();
    }

    private LocalTime operationStartTime(PlantingStep plantingStep, HarvestStep harvestStep) {
        if (plantingStep != null) return plantingStep.getStartTime();
        return harvestStep == null ? null : harvestStep.getStartTime();
    }

    private LocalTime operationEndTime(PlantingStep plantingStep, HarvestStep harvestStep) {
        if (plantingStep != null) return plantingStep.getEndTime();
        return harvestStep == null ? null : harvestStep.getEndTime();
    }
}
