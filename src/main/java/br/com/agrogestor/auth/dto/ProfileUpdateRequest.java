package br.com.agrogestor.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 120)
        String nome,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Informe um e-mail válido")
        @Size(max = 254)
        String email,

        @NotBlank(message = "A senha atual é obrigatória")
        @Size(max = 72, message = "A senha atual deve possuir no máximo 72 caracteres")
        String senhaAtual,

        @Size(
                min = 8,
                max = 72,
                message = "A nova senha deve possuir entre 8 e 72 caracteres"
        )
        String novaSenha
) {
}
