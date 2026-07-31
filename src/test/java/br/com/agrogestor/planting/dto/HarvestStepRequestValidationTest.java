package br.com.agrogestor.planting.dto;

import br.com.agrogestor.planting.entity.HarvestUnit;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class HarvestStepRequestValidationTest {

    private static ValidatorFactory validatorFactory;
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
    void shouldAcceptValidHarvestStep() {
        assertThat(validator.validate(request("8.00", "640.000"))).isEmpty();
    }

    @Test
    void shouldRejectZeroAreaAndQuantity() {
        var violations = validator.validate(request("0", "0"));

        assertThat(violations)
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("harvestedAreaHectares", "harvestQuantity");
    }

    private HarvestStepRequest request(String area, String quantity) {
        return new HarvestStepRequest(
                LocalDate.of(2026, 7, 30),
                new BigDecimal(area),
                new BigDecimal(quantity),
                HarvestUnit.BAGS_60_KG,
                "AG 8700",
                null,
                null,
                null
        );
    }
}
