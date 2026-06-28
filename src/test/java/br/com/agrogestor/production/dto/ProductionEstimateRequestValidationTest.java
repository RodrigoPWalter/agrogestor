package br.com.agrogestor.production.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ProductionEstimateRequestValidationTest {

    private static jakarta.validation.ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    @Test
    void shouldAcceptExactlyOneCostInput() {
        var request = validRequest(new BigDecimal("450000.00"), null);

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void shouldRejectWhenBothCostInputsAreProvided() {
        var request = validRequest(new BigDecimal("450000.00"), new BigDecimal("4500.00"));

        assertThat(validator.validate(request))
                .anyMatch(violation -> violation.getMessage()
                        .equals("Informe apenas o custo total estimado ou o custo por hectare"));
    }

    @Test
    void shouldRejectWhenNoCostInputIsProvided() {
        var request = validRequest(null, null);

        assertThat(validator.validate(request))
                .anyMatch(violation -> violation.getMessage()
                        .equals("Informe apenas o custo total estimado ou o custo por hectare"));
    }

    private ProductionEstimateRequest validRequest(BigDecimal totalCost, BigDecimal costPerHectare) {
        return new ProductionEstimateRequest(
                new BigDecimal("100.00"),
                new BigDecimal("60.00"),
                new BigDecimal("130.00"),
                totalCost,
                costPerHectare
        );
    }
}
