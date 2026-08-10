package br.com.agrogestor.diary.entity;

import br.com.agrogestor.inventory.entity.InventoryProduct;
import br.com.agrogestor.inventory.entity.MovementType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "field_diary_products")
public class FieldDiaryProduct {
    @Id @GeneratedValue
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entry_id", nullable = false)
    private FieldDiaryEntry entry;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private InventoryProduct product;
    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;
    @Column(name = "stock_deducted", nullable = false)
    private boolean stockDeducted;
    @Column(name = "unit_cost", nullable = false, precision = 16, scale = 6)
    private BigDecimal unitCost;
    @Column(name = "total_cost", nullable = false, precision = 16, scale = 2)
    private BigDecimal totalCost;
    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 10)
    private MovementType movementType;

    protected FieldDiaryProduct() {}

    public FieldDiaryProduct(
            FieldDiaryEntry entry,
            InventoryProduct product,
            BigDecimal quantity,
            MovementType movementType,
            BigDecimal unitCost,
            BigDecimal totalCost
    ) {
        this.entry = entry;
        this.product = product;
        this.quantity = quantity;
        this.stockDeducted = true;
        this.movementType = movementType;
        this.unitCost = unitCost;
        this.totalCost = totalCost;
    }

    public FieldDiaryProduct(
            FieldDiaryEntry entry,
            InventoryProduct product,
            BigDecimal quantity,
            MovementType movementType
    ) {
        this(entry, product, quantity, movementType, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public FieldDiaryProduct(
            FieldDiaryEntry entry,
            InventoryProduct product,
            BigDecimal quantity
    ) {
        this(entry, product, quantity, MovementType.EXIT);
    }

    public UUID getId() { return id; }
    public InventoryProduct getProduct() { return product; }
    public BigDecimal getQuantity() { return quantity; }
    public boolean isStockDeducted() { return stockDeducted; }
    public MovementType getMovementType() { return movementType; }
    public BigDecimal getUnitCost() { return unitCost; }
    public BigDecimal getTotalCost() { return totalCost; }
}
