package br.com.agrogestor.planting.entity;

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
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "planting_steps")
public class PlantingStep {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "planting_id", nullable = false)
    private Planting planting;

    @Column(name = "step_date", nullable = false)
    private LocalDate stepDate;

    @Column(name = "planted_area_hectares", nullable = false, precision = 12, scale = 2)
    private BigDecimal plantedAreaHectares;

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

    protected PlantingStep() {
    }

    public PlantingStep(
            Planting planting,
            LocalDate stepDate,
            BigDecimal plantedAreaHectares,
            LocalTime startTime,
            LocalTime endTime,
            String observations
    ) {
        update(stepDate, plantedAreaHectares, startTime, endTime, observations);
        this.planting = planting;
    }

    public void update(
            LocalDate stepDate,
            BigDecimal plantedAreaHectares,
            LocalTime startTime,
            LocalTime endTime,
            String observations
    ) {
        this.stepDate = stepDate;
        this.plantedAreaHectares = plantedAreaHectares;
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

    public LocalDate getStepDate() {
        return stepDate;
    }

    public BigDecimal getPlantedAreaHectares() {
        return plantedAreaHectares;
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
