package br.com.agrogestor.machine.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "machines")
public class Machine {
    @Id @GeneratedValue
    private UUID id;
    @Column(nullable = false, length = 120)
    private String model;
    @Column(nullable = false, length = 100)
    private String brand;
    @Column(name = "manufacture_year", nullable = false)
    private Integer manufactureYear;
    @Column(name = "usage_hours", nullable = false, precision = 12, scale = 1)
    private BigDecimal usageHours;
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Machine() {}

    public Machine(String model, String brand, Integer manufactureYear, BigDecimal usageHours) {
        update(model, brand, manufactureYear, usageHours);
    }

    public void update(String model, String brand, Integer manufactureYear, BigDecimal usageHours) {
        this.model = model;
        this.brand = brand;
        this.manufactureYear = manufactureYear;
        this.usageHours = usageHours;
    }

    @PrePersist void prePersist() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
    @PreUpdate void preUpdate() { updatedAt = OffsetDateTime.now(ZoneOffset.UTC); }

    public UUID getId() { return id; }
    public String getModel() { return model; }
    public String getBrand() { return brand; }
    public Integer getManufactureYear() { return manufactureYear; }
    public BigDecimal getUsageHours() { return usageHours; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
