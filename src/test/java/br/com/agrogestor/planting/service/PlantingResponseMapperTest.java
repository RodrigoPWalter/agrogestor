package br.com.agrogestor.planting.service;

import br.com.agrogestor.planting.entity.HarvestProgressStatus;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingProgressStatus;
import br.com.agrogestor.planting.entity.SeedRateUnit;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class PlantingResponseMapperTest {

    @Test
    void shouldDescribeAPlantingThatHasNotStarted() {
        var response = PlantingResponseMapper.toResponse(
                planting(),
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        assertThat(response.plantedAreaHectares()).isEqualByComparingTo("0.00");
        assertThat(response.remainingAreaHectares()).isEqualByComparingTo("30.00");
        assertThat(response.plantedPercentage()).isEqualByComparingTo("0.00");
        assertThat(response.plantingProgressStatus())
                .isEqualTo(PlantingProgressStatus.NOT_STARTED);
        assertThat(response.harvestProgressStatus())
                .isEqualTo(HarvestProgressStatus.NOT_STARTED);
    }

    @Test
    void shouldCalculatePlantingAndHarvestProgress() {
        var response = PlantingResponseMapper.toResponse(
                planting(),
                new BigDecimal("15"),
                new BigDecimal("7.5")
        );

        assertThat(response.plantedPercentage()).isEqualByComparingTo("50.00");
        assertThat(response.plantingProgressStatus())
                .isEqualTo(PlantingProgressStatus.IN_PROGRESS);
        assertThat(response.harvestedPercentage()).isEqualByComparingTo("50.00");
        assertThat(response.harvestRemainingAreaHectares())
                .isEqualByComparingTo("7.50");
        assertThat(response.harvestProgressStatus())
                .isEqualTo(HarvestProgressStatus.IN_PROGRESS);
    }

    @Test
    void shouldKeepAreaPlantingCompletionSeparateFromHarvestCompletion() {
        var response = PlantingResponseMapper.toResponse(
                planting(),
                new BigDecimal("30"),
                new BigDecimal("10")
        );

        assertThat(response.plantingProgressStatus())
                .isEqualTo(PlantingProgressStatus.COMPLETED);
        assertThat(response.harvestProgressStatus())
                .isEqualTo(HarvestProgressStatus.IN_PROGRESS);
    }

    private Planting planting() {
        return new Planting(
                "Milho",
                "2026",
                "Talhão 1",
                new BigDecimal("30"),
                new BigDecimal("70"),
                LocalDate.of(2026, 7, 29),
                "Híbrido",
                new BigDecimal("60000"),
                SeedRateUnit.SEEDS_PER_HECTARE,
                null
        );
    }
}
