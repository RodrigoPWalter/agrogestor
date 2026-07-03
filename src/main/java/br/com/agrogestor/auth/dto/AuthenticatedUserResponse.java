package br.com.agrogestor.auth.dto;

import br.com.agrogestor.auth.entity.UsuarioRole;

import java.util.UUID;

public record AuthenticatedUserResponse(
        UUID id,
        String nome,
        String email,
        UsuarioRole role
) {
}
