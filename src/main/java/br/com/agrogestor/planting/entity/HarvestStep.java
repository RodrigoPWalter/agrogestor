package br.com.agrogestor.planting.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "harvest_steps")
public class HarvestStep {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "planting_id", nullable = false)
    private Planting planting;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "harvested_area_hectares", nullable = false, precision = 12, scale = 2)
    private BigDecimal harvestedAreaHectares;

    @Column(name = "harvest_quantity", nullable = false, precision = 14, scale = 3)
    private BigDecimal harvestQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "harvest_unit", nullable = false, length = 30)
    private HarvestUnit harvestUnit;

    @Column(name = "seed_variety", nullable = false, length = 120)
    private String seedVariety;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(length = 1000)
    private String observations;

    @Column(name = "diary_entry_id", unique = true)
    private UUID diaryEntryId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected HarvestStep() {
    }

    public HarvestStep(
            Planting planting,
            LocalDate harvestDate,
            BigDecimal harvestedAreaHectares,
            BigDecimal harvestQuantity,
            HarvestUnit harvestUnit,
            String seedVariety,
            LocalTime startTime,
            LocalTime endTime,
            String observations
    ) {
        this.planting = planting;
        update(
                harvestDate,
                harvestedAreaHectares,
                harvestQuantity,
                harvestUnit,
                seedVariety,
                startTime,
                endTime,
                observations
        );
    }

    public void update(
            LocalDate harvestDate,
            BigDecimal harvestedAreaHectares,
            BigDecimal harvestQuantity,
            HarvestUnit harvestUnit,
            String seedVariety,
            LocalTime startTime,
            LocalTime endTime,
            String observations
    ) {
        this.harvestDate = harvestDate;
        this.harvestedAreaHectares = harvestedAreaHectares;
        this.harvestQuantity = harvestQuantity;
        this.harvestUnit = harvestUnit;
        this.seedVariety = seedVariety;
        this.startTime = startTime;
        this.endTime = endTime;
        this.observations = observations;
    }

    public void linkDiaryEntry(UUID diaryEntryId) {
        this.diaryEntryId = diaryEntryId;
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

    public Planting getPlanting() {
        return planting;
    }

    public LocalDate getHarvestDate() {
        return harvestDate;
    }

    public BigDecimal getHarvestedAreaHectares() {
        return harvestedAreaHectares;
    }

    public BigDecimal getHarvestQuantity() {
        return harvestQuantity;
    }

    public HarvestUnit getHarvestUnit() {
        return harvestUnit;
    }

    public String getSeedVariety() {
        return seedVariety;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getObservations() {
        return observations;
    }

    public UUID getDiaryEntryId() {
        return diaryEntryId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
