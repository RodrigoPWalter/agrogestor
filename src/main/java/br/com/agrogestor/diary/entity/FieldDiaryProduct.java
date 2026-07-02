package br.com.agrogestor.diary.entity;

import br.com.agrogestor.inventory.entity.InventoryProduct;
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

    protected FieldDiaryProduct() {}

    public FieldDiaryProduct(
            FieldDiaryEntry entry,
            InventoryProduct product,
            BigDecimal quantity
    ) {
        this.entry = entry;
        this.product = product;
        this.quantity = quantity;
    }

    public UUID getId() { return id; }
    public InventoryProduct getProduct() { return product; }
    public BigDecimal getQuantity() { return quantity; }
}
