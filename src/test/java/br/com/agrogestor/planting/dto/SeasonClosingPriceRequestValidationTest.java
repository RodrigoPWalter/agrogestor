package br.com.agrogestor.planting.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class SeasonClosingPriceRequestValidationTest {

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
    void shouldAcceptPositivePriceWithTwoDecimalPlaces() {
        assertThat(validator.validate(
                new SeasonClosingPriceRequest(new BigDecimal("72.50"))
        )).isEmpty();
    }

    @Test
    void shouldRejectNullZeroAndExcessDecimalPlaces() {
        assertThat(validator.validate(new SeasonClosingPriceRequest(null)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("salePricePer60KgBag");
        assertThat(validator.validate(
                new SeasonClosingPriceRequest(BigDecimal.ZERO)
        ))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("salePricePer60KgBag");
        assertThat(validator.validate(
                new SeasonClosingPriceRequest(new BigDecimal("72.505"))
        ))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("salePricePer60KgBag");
    }
}
