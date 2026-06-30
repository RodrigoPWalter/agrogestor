package br.com.agrogestor.inventory.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private InventoryProduct product;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 10)
    private MovementType movementType;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(name = "movement_date", nullable = false)
    private LocalDate movementDate;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected InventoryMovement() {
    }

    public InventoryMovement(InventoryProduct product, MovementType movementType,
                             BigDecimal quantity, LocalDate movementDate, String notes) {
        this.product = product;
        this.movementType = movementType;
        this.quantity = quantity;
        this.movementDate = movementDate;
        this.notes = notes;
    }

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() { return id; }
    public InventoryProduct getProduct() { return product; }
    public MovementType getMovementType() { return movementType; }
    public BigDecimal getQuantity() { return quantity; }
    public LocalDate getMovementDate() { return movementDate; }
    public String getNotes() { return notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
