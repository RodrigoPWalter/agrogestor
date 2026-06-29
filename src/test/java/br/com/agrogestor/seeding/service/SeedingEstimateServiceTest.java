package br.com.agrogestor.seeding.service;

import br.com.agrogestor.seeding.dto.SeedingEstimateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class SeedingEstimateServiceTest {

    private SeedingEstimateService service;

    @BeforeEach
    void setUp() {
        service = new SeedingEstimateService();
    }

    @Test
    void shouldCalculateDistributionFromTotalSeedCount() {
        var request = new SeedingEstimateRequest(
                new BigDecimal("10.00"),
                new BigDecimal("50.00"),
                new BigDecimal("2000000"),
                null,
                null,
                new BigDecimal("90.00"),
                new BigDecimal("90.00")
        );

        var result = service.calculate(request);

        assertThat(result.totalRowLengthMeters()).isEqualByComparingTo("200000.00");
        assertThat(result.seedsPerHectare()).isEqualByComparingTo("200000");
        assertThat(result.seedsPerLinearMeter()).isEqualByComparingTo("10.00");
        assertThat(result.expectedPlantsPerHectare()).isEqualByComparingTo("162000");
        assertThat(result.expectedPlantsPerLinearMeter()).isEqualByComparingTo("8.10");
    }

    @Test
    void shouldCalculateSeedCountFromWeightAndThousandSeedWeight() {
        var request = new SeedingEstimateRequest(
                new BigDecimal("18.50"),
                new BigDecimal("45.00"),
                null,
                new BigDecimal("925.000"),
                new BigDecimal("200.00"),
                new BigDecimal("90.00"),
                new BigDecimal("90.00")
        );

        var result = service.calculate(request);

        assertThat(result.totalEstimatedSeeds()).isEqualByComparingTo("4625000");
        assertThat(result.seedsPerHectare()).isEqualByComparingTo("250000");
        assertThat(result.seedsPerLinearMeter()).isEqualByComparingTo("11.25");
        assertThat(result.expectedPlantsPerHectare()).isEqualByComparingTo("202500");
        assertThat(result.expectedPlantsPerLinearMeter()).isEqualByComparingTo("9.11");
    }
}
