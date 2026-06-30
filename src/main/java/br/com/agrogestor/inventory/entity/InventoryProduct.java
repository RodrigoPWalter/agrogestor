package br.com.agrogestor.inventory.entity;

import jakarta.persistence.*;
import br.com.agrogestor.shared.exception.BusinessRuleException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "inventory_products")
public class InventoryProduct {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 140)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 20)
    private ProductType productType;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MeasurementUnit unit;

    @Column(name = "minimum_stock", nullable = false, precision = 14, scale = 3)
    private BigDecimal minimumStock;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected InventoryProduct() {
    }

    public InventoryProduct(String name, ProductType productType, BigDecimal quantity,
                            MeasurementUnit unit, BigDecimal minimumStock, LocalDate expirationDate) {
        this.quantity = quantity;
        update(name, productType, unit, minimumStock, expirationDate);
    }

    public void update(String name, ProductType productType, MeasurementUnit unit,
                       BigDecimal minimumStock, LocalDate expirationDate) {
        this.name = name;
        this.productType = productType;
        this.unit = unit;
        this.minimumStock = minimumStock;
        this.expirationDate = expirationDate;
    }

    public void applyMovement(MovementType type, BigDecimal amount) {
        BigDecimal newQuantity = type == MovementType.ENTRY
                ? quantity.add(amount)
                : quantity.subtract(amount);
        if (newQuantity.signum() < 0) {
            throw new BusinessRuleException("A saída não pode ser maior que o estoque disponível");
        }
        quantity = newQuantity;
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

    public UUID getId() { return id; }
    public String getName() { return name; }
    public ProductType getProductType() { return productType; }
    public BigDecimal getQuantity() { return quantity; }
    public MeasurementUnit getUnit() { return unit; }
    public BigDecimal getMinimumStock() { return minimumStock; }
    public LocalDate getExpirationDate() { return expirationDate; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
