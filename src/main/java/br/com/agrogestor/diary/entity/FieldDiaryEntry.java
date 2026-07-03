package br.com.agrogestor.diary.entity;

import br.com.agrogestor.planting.entity.Planting;
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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "field_diary_entries")
public class FieldDiaryEntry {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planting_id")
    private Planting planting;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 30)
    private ActivityType activityType;

    @Column(nullable = false, length = 160)
    private String activity;

    @Column(name = "weather_condition", length = 120)
    private String weatherCondition;

    @Column(name = "applied_products", length = 500)
    private String appliedProducts;

    @Column(length = 1000)
    private String observations;

    @Column(name = "rainfall_mm", precision = 8, scale = 2)
    private BigDecimal rainfallMillimeters;

    @Column(length = 160)
    private String supplier;

    @Column(precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "machine_id")
    private UUID machineId;

    @Column(name = "harvest_quantity", precision = 14, scale = 3)
    private BigDecimal harvestQuantity;

    @Column(name = "harvest_unit", length = 30)
    private String harvestUnit;

    @Column(name = "rainfall_id")
    private UUID rainfallId;

    @Column(name = "maintenance_id")
    private UUID maintenanceId;

    @Column(name = "expense_id")
    private UUID expenseId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected FieldDiaryEntry() {
    }

    public FieldDiaryEntry(
            Planting planting,
            LocalDate entryDate,
            ActivityType activityType,
            String activity,
            String weatherCondition,
            String appliedProducts,
            String observations
    ) {
        update(
                planting,
                entryDate,
                activityType,
                activity,
                weatherCondition,
                appliedProducts,
                observations
        );
    }

    public void update(
            Planting planting,
            LocalDate entryDate,
            ActivityType activityType,
            String activity,
            String weatherCondition,
            String appliedProducts,
            String observations
    ) {
        this.planting = planting;
        this.entryDate = entryDate;
        this.activityType = activityType;
        this.activity = activity;
        this.weatherCondition = weatherCondition;
        this.appliedProducts = appliedProducts;
        this.observations = observations;
    }

    public void updateDetails(
            BigDecimal rainfallMillimeters,
            String supplier,
            BigDecimal amount,
            UUID machineId,
            BigDecimal harvestQuantity,
            String harvestUnit
    ) {
        this.rainfallMillimeters = rainfallMillimeters;
        this.supplier = supplier;
        this.amount = amount;
        this.machineId = machineId;
        this.harvestQuantity = harvestQuantity;
        this.harvestUnit = harvestUnit;
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

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public ActivityType getActivityType() {
        return activityType;
    }

    public String getActivity() {
        return activity;
    }

    public String getWeatherCondition() {
        return weatherCondition;
    }

    public String getAppliedProducts() {
        return appliedProducts;
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

    public BigDecimal getRainfallMillimeters() { return rainfallMillimeters; }
    public String getSupplier() { return supplier; }
    public BigDecimal getAmount() { return amount; }
    public UUID getMachineId() { return machineId; }
    public BigDecimal getHarvestQuantity() { return harvestQuantity; }
    public String getHarvestUnit() { return harvestUnit; }
    public UUID getRainfallId() { return rainfallId; }
    public UUID getMaintenanceId() { return maintenanceId; }
    public UUID getExpenseId() { return expenseId; }

    public void linkRainfall(UUID id) { rainfallId = id; }
    public void linkMaintenance(UUID id) { maintenanceId = id; }
    public void linkExpense(UUID id) { expenseId = id; }

    public void clearIntegrationLinks() {
        rainfallId = null;
        maintenanceId = null;
        expenseId = null;
    }
}
