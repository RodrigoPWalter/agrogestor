package br.com.agrogestor.production.entity;

import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.property.entity.Property;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "production_sales")
public class ProductionSale {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "planting_id", nullable = false)
    private Planting planting;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Column(name = "quantity_bags", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityBags;

    @Column(name = "price_per_bag", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerBag;

    @Column(length = 120)
    private String buyer;

    @Column(length = 1000)
    private String observations;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected ProductionSale() {
    }

    public ProductionSale(
            Property property,
            Planting planting,
            LocalDate saleDate,
            BigDecimal quantityBags,
            BigDecimal pricePerBag,
            String buyer,
            String observations
    ) {
        this.property = property;
        this.planting = planting;
        update(saleDate, quantityBags, pricePerBag, buyer, observations);
    }

    public void update(
            LocalDate saleDate,
            BigDecimal quantityBags,
            BigDecimal pricePerBag,
            String buyer,
            String observations
    ) {
        this.saleDate = saleDate;
        this.quantityBags = quantityBags;
        this.pricePerBag = pricePerBag;
        this.buyer = buyer;
        this.observations = observations;
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
    public Planting getPlanting() { return planting; }
    public LocalDate getSaleDate() { return saleDate; }
    public BigDecimal getQuantityBags() { return quantityBags; }
    public BigDecimal getPricePerBag() { return pricePerBag; }
    public String getBuyer() { return buyer; }
    public String getObservations() { return observations; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
