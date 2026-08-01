package br.com.agrogestor.planting.service;

import br.com.agrogestor.planting.dto.PlantingResponse;
import br.com.agrogestor.planting.entity.HarvestProgressStatus;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingProgressStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;

final class PlantingResponseMapper {

    private PlantingResponseMapper() {
    }

    static PlantingResponse toResponse(
            Planting planting,
            BigDecimal plantedArea,
            BigDecimal harvestedArea
    ) {
        BigDecimal plannedArea = planting.getPlannedAreaHectares();
        BigDecimal normalizedPlantedArea = area(plantedArea);
        BigDecimal remainingArea = area(
                plannedArea.subtract(normalizedPlantedArea).max(BigDecimal.ZERO)
        );
        BigDecimal plantedPercentage = percentage(normalizedPlantedArea, plannedArea);
        PlantingProgressStatus progressStatus = plantingStatus(
                normalizedPlantedArea,
                plannedArea
        );
        BigDecimal normalizedHarvestedArea = area(harvestedArea);
        BigDecimal harvestRemainingArea = area(
                normalizedPlantedArea
                        .subtract(normalizedHarvestedArea)
                        .max(BigDecimal.ZERO)
        );
        BigDecimal harvestedPercentage = percentage(
                normalizedHarvestedArea,
                normalizedPlantedArea
        );
        HarvestProgressStatus harvestProgressStatus = harvestStatus(
                normalizedHarvestedArea,
                normalizedPlantedArea
        );

        return new PlantingResponse(
                planting.getId(),
                planting.getCrop(),
                planting.getHarvest(),
                planting.getFieldName(),
                area(plannedArea),
                planting.getRowSpacingCentimeters(),
                normalizedPlantedArea,
                remainingArea,
                plantedPercentage,
                progressStatus,
                progressStatus.getDisplayName(),
                normalizedHarvestedArea,
                harvestRemainingArea,
                harvestedPercentage,
                harvestProgressStatus,
                harvestProgressStatus.getDisplayName(),
                planting.getStartDate(),
                planting.getSeedVariety(),
                planting.getSeedRate(),
                planting.getSeedRateUnit(),
                planting.getSeedRateUnit() == null
                        ? null
                        : planting.getSeedRateUnit().getDisplayName(),
                planting.getObservations(),
                planting.getStatus(),
                planting.getStatus().getDisplayName(),
                planting.getCompletedAt(),
                planting.getCreatedAt(),
                planting.getUpdatedAt()
        );
    }

    private static PlantingProgressStatus plantingStatus(
            BigDecimal plantedArea,
            BigDecimal plannedArea
    ) {
        if (plantedArea.signum() == 0) {
            return PlantingProgressStatus.NOT_STARTED;
        }
        if (plantedArea.compareTo(plannedArea) >= 0) {
            return PlantingProgressStatus.COMPLETED;
        }
        return PlantingProgressStatus.IN_PROGRESS;
    }

    private static HarvestProgressStatus harvestStatus(
            BigDecimal harvestedArea,
            BigDecimal plantedArea
    ) {
        if (harvestedArea.signum() == 0) {
            return HarvestProgressStatus.NOT_STARTED;
        }
        if (plantedArea.signum() > 0
                && harvestedArea.compareTo(plantedArea) >= 0) {
            return HarvestProgressStatus.COMPLETED;
        }
        return HarvestProgressStatus.IN_PROGRESS;
    }

    private static BigDecimal percentage(BigDecimal value, BigDecimal total) {
        if (total.signum() == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.multiply(new BigDecimal("100"))
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal area(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
