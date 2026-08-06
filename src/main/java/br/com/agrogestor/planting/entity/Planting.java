package br.com.agrogestor.planting.entity;

import br.com.agrogestor.shared.exception.BusinessRuleException;
import br.com.agrogestor.property.entity.Property;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false, length = 80)
    private String crop;

    @Column(nullable = false, length = 9)
    private String harvest;

    @Column(name = "field_name", length = 120)
    private String fieldName;

    @Column(name = "planned_area_hectares", nullable = false, precision = 12, scale = 2)
    private BigDecimal plannedAreaHectares;

    @Column(name = "row_spacing_centimeters", precision = 6, scale = 2)
    private BigDecimal rowSpacingCentimeters;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "seed_variety", nullable = false, length = 120)
    private String seedVariety;

    @Column(name = "seed_quantity", nullable = false, precision = 14, scale = 3)
    private BigDecimal seedRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "seed_rate_unit", length = 30)
    private SeedRateUnit seedRateUnit;

    @Column(length = 1000)
    private String observations;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlantingStatus status = PlantingStatus.ACTIVE;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Planting() {
    }

    public Planting(
            Property property,
            String crop,
            String harvest,
            String fieldName,
            BigDecimal plannedAreaHectares,
            BigDecimal rowSpacingCentimeters,
            LocalDate startDate,
            String seedVariety,
            BigDecimal seedRate,
            SeedRateUnit seedRateUnit,
            String observations
    ) {
        this.property = property;
        update(
                crop,
                harvest,
                fieldName,
                plannedAreaHectares,
                rowSpacingCentimeters,
                startDate,
                seedVariety,
                seedRate,
                seedRateUnit,
                observations
        );
    }

    public Planting(
            Property property,
            String crop,
            String harvest,
            String fieldName,
            BigDecimal plannedAreaHectares,
            LocalDate startDate,
            String seedVariety,
            BigDecimal seedRate,
            SeedRateUnit seedRateUnit,
            String observations
    ) {
        this(
                property,
                crop,
                harvest,
                fieldName,
                plannedAreaHectares,
                null,
                startDate,
                seedVariety,
                seedRate,
                seedRateUnit,
                observations
        );
    }

    public Planting(
            Property property,
            String crop,
            String harvest,
            BigDecimal plannedAreaHectares,
            LocalDate startDate,
            String seedVariety,
            BigDecimal seedRate,
            SeedRateUnit seedRateUnit,
            String observations
    ) {
        this(
                property,
                crop,
                harvest,
                null,
                plannedAreaHectares,
                null,
                startDate,
                seedVariety,
                seedRate,
                seedRateUnit,
                observations
        );
    }

    public void update(
            String crop,
            String harvest,
            String fieldName,
            BigDecimal plannedAreaHectares,
            BigDecimal rowSpacingCentimeters,
            LocalDate startDate,
            String seedVariety,
            BigDecimal seedRate,
            SeedRateUnit seedRateUnit,
            String observations
    ) {
        this.crop = crop;
        this.harvest = harvest;
        this.fieldName = fieldName;
        this.plannedAreaHectares = plannedAreaHectares;
        this.rowSpacingCentimeters = rowSpacingCentimeters;
        this.startDate = startDate;
        this.seedVariety = seedVariety;
        this.seedRate = seedRate;
        this.seedRateUnit = seedRateUnit;
        this.observations = observations;
    }

    @PrePersist
    void prePersist() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }

    public void finish() {
        if (status == PlantingStatus.HARVESTED) {
            throw new BusinessRuleException("Este plantio já está finalizado");
        }
        status = PlantingStatus.HARVESTED;
        completedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public void reactivate() {
        if (status == PlantingStatus.ACTIVE) {
            throw new BusinessRuleException("Este plantio já está ativo");
        }
        status = PlantingStatus.ACTIVE;
        completedAt = null;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() {
        return id;
    }

    public Property getProperty() {
        return property;
    }

    public String getCrop() {
        return crop;
    }

    public String getHarvest() {
        return harvest;
    }

    public String getFieldName() {
        return fieldName;
    }

    public BigDecimal getPlannedAreaHectares() {
        return plannedAreaHectares;
    }

    public BigDecimal getRowSpacingCentimeters() {
        return rowSpacingCentimeters;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public String getSeedVariety() {
        return seedVariety;
    }

    public BigDecimal getSeedRate() {
        return seedRate;
    }

    public SeedRateUnit getSeedRateUnit() {
        return seedRateUnit;
    }

    public String getObservations() {
        return observations;
    }

    public PlantingStatus getStatus() {
        return status;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
