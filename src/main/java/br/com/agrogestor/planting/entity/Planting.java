package br.com.agrogestor.planting.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "plantings")
public class Planting {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 80)
    private String crop;

    @Column(nullable = false, length = 9)
    private String harvest;

    @Column(name = "planted_area_hectares", nullable = false, precision = 12, scale = 2)
    private BigDecimal plantedAreaHectares;

    @Column(name = "planting_date", nullable = false)
    private LocalDate plantingDate;

    @Column(name = "seed_variety", nullable = false, length = 120)
    private String seedVariety;

    @Column(name = "seed_quantity", nullable = false, precision = 14, scale = 3)
    private BigDecimal seedQuantity;

    @Column(length = 1000)
    private String observations;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Planting() {
    }

    public Planting(
            String crop,
            String harvest,
            BigDecimal plantedAreaHectares,
            LocalDate plantingDate,
            String seedVariety,
            BigDecimal seedQuantity,
            String observations
    ) {
        update(crop, harvest, plantedAreaHectares, plantingDate, seedVariety, seedQuantity, observations);
    }

    public void update(
            String crop,
            String harvest,
            BigDecimal plantedAreaHectares,
            LocalDate plantingDate,
            String seedVariety,
            BigDecimal seedQuantity,
            String observations
    ) {
        this.crop = crop;
        this.harvest = harvest;
        this.plantedAreaHectares = plantedAreaHectares;
        this.plantingDate = plantingDate;
        this.seedVariety = seedVariety;
        this.seedQuantity = seedQuantity;
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

    public UUID getId() {
        return id;
    }

    public String getCrop() {
        return crop;
    }

    public String getHarvest() {
        return harvest;
    }

    public BigDecimal getPlantedAreaHectares() {
        return plantedAreaHectares;
    }

    public LocalDate getPlantingDate() {
        return plantingDate;
    }

    public String getSeedVariety() {
        return seedVariety;
    }

    public BigDecimal getSeedQuantity() {
        return seedQuantity;
    }

    public String getObservations() {
        return observations;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
