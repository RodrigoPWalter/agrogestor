package br.com.agrogestor.expense.dto;

import br.com.agrogestor.expense.entity.ExpenseCategory;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ExpenseRequestValidationTest {

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
    void shouldAcceptValidExpense() {
        var request = new ExpenseRequest(
                UUID.randomUUID(),
                "Adubo de base",
                ExpenseCategory.FERTILIZERS,
                new BigDecimal("2500.00"),
                LocalDate.of(2026, 10, 20),
                null
        );

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void shouldRejectNonPositiveAmountAndMissingDescription() {
        var request = new ExpenseRequest(
                UUID.randomUUID(),
                " ",
                ExpenseCategory.FERTILIZERS,
                BigDecimal.ZERO,
                LocalDate.of(2026, 10, 20),
                null
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("description", "amount");
    }
}
