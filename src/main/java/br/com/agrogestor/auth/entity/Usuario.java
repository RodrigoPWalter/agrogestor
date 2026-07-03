package br.com.agrogestor.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UsuarioRole role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Usuario() {
    }

    public Usuario(String nome, String email, String senhaHash, UsuarioRole role) {
        atualizarDados(nome, email, role);
        atualizarSenha(senhaHash);
    }

    public void atualizarDados(String nome, String email, UsuarioRole role) {
        this.nome = normalizar(nome);
        this.email = normalizarEmail(email);
        this.role = role;
    }

    public void atualizarSenha(String senhaHash) {
        this.senhaHash = senhaHash;
    }

    @PrePersist
    void prePersist() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    private String normalizar(String valor) {
        return valor.trim().replaceAll("\\s+", " ");
    }

    private String normalizarEmail(String valor) {
        return valor.trim().toLowerCase(Locale.ROOT);
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public UsuarioRole getRole() {
        return role;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
