package br.com.agrogestor.machine.dto;

import jakarta.validation.Validation;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class MachineRequestValidationTest {
    private static jakarta.validation.ValidatorFactory factory;
    private static jakarta.validation.Validator validator;

    @BeforeAll static void setup() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    @AfterAll static void close() { factory.close(); }

    @Test
    void shouldAcceptValidMachine() {
        assertThat(validator.validate(new MachineRequest(
                "6110J", "John Deere", 2022, new BigDecimal("1250.5")))).isEmpty();
    }

    @Test
    void shouldRejectInvalidYearAndNegativeHours() {
        var violations = validator.validate(new MachineRequest(
                "Modelo", "Marca", 1800, new BigDecimal("-1")));
        assertThat(violations).extracting(item -> item.getPropertyPath().toString())
                .contains("manufactureYear", "usageHours");
    }
}
