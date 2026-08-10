package br.com.agrogestor.inventory.entity;

import jakarta.persistence.*;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.property.entity.Property;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "inventory_products")
public class InventoryProduct {

    private static final int MONEY_SCALE = 2;
    private static final int UNIT_COST_SCALE = 6;

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

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

    @Column(name = "inventory_value", nullable = false, precision = 16, scale = 2)
    private BigDecimal inventoryValue;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected InventoryProduct() {
    }

    public InventoryProduct(Property property, String name, ProductType productType, BigDecimal quantity,
                            MeasurementUnit unit, BigDecimal minimumStock, LocalDate expirationDate) {
        this.property = property;
        this.quantity = quantity;
        this.inventoryValue = BigDecimal.ZERO.setScale(MONEY_SCALE);
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
        if (type == MovementType.ENTRY) {
            applyEntry(amount, BigDecimal.ZERO);
        } else {
            applyExit(amount);
        }
    }

    public InventoryMovementCost applyEntry(BigDecimal amount, BigDecimal totalCost) {
        BigDecimal normalizedCost = money(totalCost);
        if (normalizedCost.signum() < 0) {
            throw new BusinessRuleException("O custo de entrada não pode ser negativo");
        }
        quantity = quantity.add(amount);
        inventoryValue = money(inventoryValue.add(normalizedCost));
        return cost(amount, normalizedCost);
    }

    public InventoryMovementCost applyExit(BigDecimal amount) {
        BigDecimal newQuantity = quantity.subtract(amount);
        if (newQuantity.signum() < 0) {
            throw new BusinessRuleException("A saída não pode ser maior que o estoque disponível");
        }

        BigDecimal totalCost = amount.compareTo(quantity) == 0
                ? inventoryValue
                : money(getAverageUnitCost().multiply(amount));
        quantity = newQuantity;
        inventoryValue = money(inventoryValue.subtract(totalCost).max(BigDecimal.ZERO));
        return cost(amount, totalCost);
    }

    public void reverseMovement(
            MovementType originalType,
            BigDecimal amount,
            BigDecimal totalCost
    ) {
        BigDecimal normalizedCost = money(totalCost);
        if (originalType == MovementType.EXIT) {
            quantity = quantity.add(amount);
            inventoryValue = money(inventoryValue.add(normalizedCost));
            return;
        }

        BigDecimal newQuantity = quantity.subtract(amount);
        BigDecimal newValue = inventoryValue.subtract(normalizedCost);
        if (newQuantity.signum() < 0 || newValue.signum() < 0) {
            throw new BusinessRuleException(
                    "Não é possível remover esta compra porque parte do produto já foi usada"
            );
        }
        quantity = newQuantity;
        inventoryValue = money(newValue);
    }

    private InventoryMovementCost cost(BigDecimal amount, BigDecimal totalCost) {
        BigDecimal unitCost = amount.signum() == 0
                ? BigDecimal.ZERO.setScale(UNIT_COST_SCALE)
                : totalCost.divide(amount, UNIT_COST_SCALE, RoundingMode.HALF_UP);
        return new InventoryMovementCost(unitCost, money(totalCost));
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
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
    public Property getProperty() { return property; }
    public String getName() { return name; }
    public ProductType getProductType() { return productType; }
    public BigDecimal getQuantity() { return quantity; }
    public MeasurementUnit getUnit() { return unit; }
    public BigDecimal getMinimumStock() { return minimumStock; }
    public BigDecimal getInventoryValue() { return inventoryValue; }
    public BigDecimal getAverageUnitCost() {
        if (quantity == null || quantity.signum() == 0 || inventoryValue == null) {
            return BigDecimal.ZERO.setScale(UNIT_COST_SCALE);
        }
        return inventoryValue.divide(quantity, UNIT_COST_SCALE, RoundingMode.HALF_UP);
    }
    public LocalDate getExpirationDate() { return expirationDate; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
