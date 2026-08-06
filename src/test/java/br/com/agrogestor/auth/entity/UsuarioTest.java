package br.com.agrogestor.auth.entity;

import br.com.agrogestor.property.entity.Property;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UsuarioTest {

    @Test
    void shouldNormalizeNameAndEmail() {
        Usuario usuario = new Usuario(
                new Property("Teste"),
                "  Rodrigo   Walter  ",
                "  Rodrigo@Example.COM ",
                "senha-criptografada",
                UsuarioRole.ADMIN
        );

        assertThat(usuario.getNome()).isEqualTo("Rodrigo Walter");
        assertThat(usuario.getEmail()).isEqualTo("rodrigo@example.com");
        assertThat(usuario.getRole()).isEqualTo(UsuarioRole.ADMIN);
    }

    @Test
    void shouldReplaceEncryptedPassword() {
        Usuario usuario = new Usuario(
                new Property("Teste"),
                "Rodrigo Walter",
                "rodrigo@example.com",
                "hash-antigo",
                UsuarioRole.USER
        );

        usuario.atualizarSenha("hash-novo");

        assertThat(usuario.getSenhaHash()).isEqualTo("hash-novo");
    }
}
