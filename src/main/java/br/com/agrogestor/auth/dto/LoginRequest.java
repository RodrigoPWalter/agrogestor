package br.com.agrogestor.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Informe um e-mail válido")
        @Size(max = 254)
        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(max = 100)
        String password
) {
}
