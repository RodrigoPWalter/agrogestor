package br.com.agrogestor.production.service;

import br.com.agrogestor.production.dto.ProductionEstimateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ProductionEstimateServiceTest {

    private ProductionEstimateService service;

    @BeforeEach
    void setUp() {
        service = new ProductionEstimateService();
    }

    @Test
    void shouldCalculateUsingTotalEstimatedCost() {
        var request = request(new BigDecimal("450000.00"), null);

        var result = service.calculate(request);

        assertThat(result.totalEstimatedProductionBags()).isEqualByComparingTo("6000.00");
        assertThat(result.estimatedGrossRevenue()).isEqualByComparingTo("780000.00");
        assertThat(result.totalCost()).isEqualByComparingTo("450000.00");
        assertThat(result.estimatedProfit()).isEqualByComparingTo("330000.00");
    }

    @Test
    void shouldCalculateTotalCostFromCostPerHectare() {
        var request = request(null, new BigDecimal("4500.00"));

        var result = service.calculate(request);

        assertThat(result.totalCost()).isEqualByComparingTo("450000.00");
        assertThat(result.estimatedProfit()).isEqualByComparingTo("330000.00");
    }

    @Test
    void shouldKeepNegativeProfitWhenEstimateIndicatesLoss() {
        var request = new ProductionEstimateRequest(
                new BigDecimal("10.00"),
                new BigDecimal("20.00"),
                new BigDecimal("50.00"),
                new BigDecimal("12000.00"),
                null
        );

        var result = service.calculate(request);

        assertThat(result.estimatedGrossRevenue()).isEqualByComparingTo("10000.00");
        assertThat(result.estimatedProfit()).isEqualByComparingTo("-2000.00");
    }

    private ProductionEstimateRequest request(BigDecimal totalCost, BigDecimal costPerHectare) {
        return new ProductionEstimateRequest(
                new BigDecimal("100.00"),
                new BigDecimal("60.00"),
                new BigDecimal("130.00"),
                totalCost,
                costPerHectare
        );
    }
}
