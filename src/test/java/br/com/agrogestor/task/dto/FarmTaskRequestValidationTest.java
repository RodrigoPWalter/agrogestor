package br.com.agrogestor.task.dto;

import br.com.agrogestor.task.entity.FarmTaskCategory;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class FarmTaskRequestValidationTest {

    private static jakarta.validation.ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void close() {
        factory.close();
    }

    @Test
    void shouldAcceptValidTask() {
        assertThat(validator.validate(request("Revisar a plantadeira", 240))).isEmpty();
    }

    @Test
    void shouldRejectBlankTitleAndTooShortDuration() {
        assertThat(validator.validate(request(" ", 5)))
                .extracting(item -> item.getPropertyPath().toString())
                .contains("title", "estimatedDurationMinutes");
    }

    private FarmTaskRequest request(String title, int durationMinutes) {
        return new FarmTaskRequest(
                title,
                FarmTaskCategory.MACHINE,
                LocalDate.of(2026, 10, 10),
                durationMinutes,
                null,
                null,
                null
        );
    }
}
