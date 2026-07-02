package br.com.agrogestor.diary.dto;

import br.com.agrogestor.diary.entity.ActivityType;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class FieldDiaryRequestValidationTest {

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
    void shouldAcceptValidEntry() {
        assertThat(validator.validate(validRequest(LocalDate.now()))).isEmpty();
    }

    @Test
    void shouldRejectFutureDate() {
        assertThat(validator.validate(validRequest(LocalDate.now().plusDays(1))))
                .extracting(item -> item.getPropertyPath().toString())
                .contains("entryDate");
    }

    private FieldDiaryRequest validRequest(LocalDate date) {
        return new FieldDiaryRequest(
                UUID.randomUUID(),
                date,
                ActivityType.INSPECTION,
                "Vistoria de pragas",
                "Tempo seco",
                null,
                null,
                null
        );
    }
}
