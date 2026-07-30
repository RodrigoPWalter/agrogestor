package br.com.agrogestor.planting.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class PlantingRequestValidationTest {

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
    void shouldAcceptSingleYearAndYearRangeHarvests() {
        assertThat(validator.validate(validRequest("2026"))).isEmpty();
        assertThat(validator.validate(validRequest("2026/2027"))).isEmpty();
    }

    @Test
    void shouldRejectInvalidHarvestFormat() {
        assertThat(validator.validate(validRequest("26/27")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("harvest");
    }

    @Test
    void shouldValidateOptionalRowSpacing() {
        assertThat(validator.validate(requestWithRowSpacing("70"))).isEmpty();
        assertThat(validator.validate(requestWithRowSpacing("0")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("rowSpacingCentimeters");
        assertThat(validator.validate(requestWithRowSpacing("1000.01")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("rowSpacingCentimeters");
    }

    private PlantingRequest validRequest(String harvest) {
        return new PlantingRequest(
                "Trigo",
                harvest,
                new BigDecimal("18.50"),
                LocalDate.of(2026, 7, 2),
                "Brava",
                new BigDecimal("200"),
                null
        );
    }

    private PlantingRequest requestWithRowSpacing(String value) {
        return new PlantingRequest(
                "Milho",
                "2026",
                "Talhão 1",
                new BigDecimal("12.00"),
                new BigDecimal(value),
                LocalDate.of(2026, 7, 30),
                "AG 8700",
                new BigDecimal("10"),
                null
        );
    }
}
