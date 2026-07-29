package br.com.agrogestor.auth.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileUpdateRequestValidationTest {

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
    void shouldAcceptProfileUpdateWithoutChangingPassword() {
        var request = new ProfileUpdateRequest(
                "Rodrigo",
                "rodrigo@agro.local",
                "senha-atual",
                null
        );

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void shouldRejectInvalidEmailAndShortNewPassword() {
        var request = new ProfileUpdateRequest(
                "Rodrigo",
                "email-invalido",
                "senha-atual",
                "curta"
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("email", "novaSenha");
    }
}
