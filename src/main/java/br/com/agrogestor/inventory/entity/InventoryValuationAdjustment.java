package br.com.agrogestor.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "inventory_valuation_adjustments")
public class InventoryValuationAdjustment {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private InventoryProduct product;

    @Column(name = "adjustment_date", nullable = false)
    private LocalDate adjustmentDate;

    @Column(name = "previous_unit_cost", nullable = false, precision = 16, scale = 6)
    private BigDecimal previousUnitCost;

    @Column(name = "new_unit_cost", nullable = false, precision = 16, scale = 6)
    private BigDecimal newUnitCost;

    @Column(name = "previous_inventory_value", nullable = false, precision = 16, scale = 2)
    private BigDecimal previousInventoryValue;

    @Column(name = "new_inventory_value", nullable = false, precision = 16, scale = 2)
    private BigDecimal newInventoryValue;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected InventoryValuationAdjustment() {
    }

    public InventoryValuationAdjustment(
            InventoryProduct product,
            LocalDate adjustmentDate,
            BigDecimal previousUnitCost,
            BigDecimal newUnitCost,
            BigDecimal previousInventoryValue,
            BigDecimal newInventoryValue,
            String reason
    ) {
        this.product = product;
        this.adjustmentDate = adjustmentDate;
        this.previousUnitCost = previousUnitCost;
        this.newUnitCost = newUnitCost;
        this.previousInventoryValue = previousInventoryValue;
        this.newInventoryValue = newInventoryValue;
        this.reason = reason;
    }

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() { return id; }
    public InventoryProduct getProduct() { return product; }
    public LocalDate getAdjustmentDate() { return adjustmentDate; }
    public BigDecimal getPreviousUnitCost() { return previousUnitCost; }
    public BigDecimal getNewUnitCost() { return newUnitCost; }
    public BigDecimal getPreviousInventoryValue() { return previousInventoryValue; }
    public BigDecimal getNewInventoryValue() { return newInventoryValue; }
    public String getReason() { return reason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
