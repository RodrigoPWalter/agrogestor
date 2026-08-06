package br.com.agrogestor.auth.dto;

import br.com.agrogestor.auth.entity.UsuarioRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String nome,
        String email,
        UsuarioRole role,
        boolean ativo,
        UUID propriedadeId,
        String propriedade,
        OffsetDateTime criadoEm
) {
}
