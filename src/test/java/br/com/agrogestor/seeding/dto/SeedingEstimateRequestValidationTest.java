package br.com.agrogestor.seeding.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class SeedingEstimateRequestValidationTest {

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
    void shouldAcceptWeightAndThousandSeedWeightTogether() {
        var request = request(null, new BigDecimal("925"), new BigDecimal("200"));

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void shouldRejectIncompleteWeightInput() {
        var request = request(null, new BigDecimal("925"), null);

        assertThat(validator.validate(request))
                .anyMatch(violation -> violation.getPropertyPath().toString()
                        .equals("seedInputValid"));
    }

    @Test
    void shouldRejectTwoSeedInputMethodsAtTheSameTime() {
        var request = request(
                new BigDecimal("1000000"),
                new BigDecimal("925"),
                new BigDecimal("200")
        );

        assertThat(validator.validate(request))
                .anyMatch(violation -> violation.getPropertyPath().toString()
                        .equals("seedInputValid"));
    }

    private SeedingEstimateRequest request(
            BigDecimal seedCount,
            BigDecimal seedWeight,
            BigDecimal thousandSeedWeight
    ) {
        return new SeedingEstimateRequest(
                new BigDecimal("18.50"),
                new BigDecimal("45.00"),
                seedCount,
                seedWeight,
                thousandSeedWeight,
                new BigDecimal("90.00"),
                new BigDecimal("90.00")
        );
    }
}
