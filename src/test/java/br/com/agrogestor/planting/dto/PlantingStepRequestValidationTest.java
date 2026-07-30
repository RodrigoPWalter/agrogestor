package br.com.agrogestor.planting.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class PlantingStepRequestValidationTest {

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
    void shouldRejectZeroOrNegativeArea() {
        assertThat(validator.validate(request(BigDecimal.ZERO, LocalDate.now())))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("plantedAreaHectares");
        assertThat(validator.validate(request(new BigDecimal("-1"), LocalDate.now())))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("plantedAreaHectares");
    }

    @Test
    void shouldRejectFutureDate() {
        assertThat(validator.validate(request(
                new BigDecimal("5.00"),
                LocalDate.now().plusDays(1)
        )))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("stepDate");
    }

    private PlantingStepRequest request(BigDecimal area, LocalDate date) {
        return new PlantingStepRequest(date, area, null, null, null);
    }
}
