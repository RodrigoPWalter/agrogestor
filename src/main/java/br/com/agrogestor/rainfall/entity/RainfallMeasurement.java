package br.com.agrogestor.rainfall.entity;

import br.com.agrogestor.planting.entity.Planting;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "rainfall_measurements")
public class RainfallMeasurement {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "measurement_date", nullable = false)
    private LocalDate measurementDate;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planting_id")
    private Planting planting;
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal millimeters;
    @Column(length = 500)
    private String notes;
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected RainfallMeasurement() {}

    public RainfallMeasurement(LocalDate measurementDate, BigDecimal millimeters, String notes) {
        this(null, measurementDate, millimeters, notes);
    }

    public RainfallMeasurement(
            Planting planting,
            LocalDate measurementDate,
            BigDecimal millimeters,
            String notes
    ) {
        this.planting = planting;
        update(measurementDate, millimeters, notes);
    }

    public void update(LocalDate measurementDate, BigDecimal millimeters, String notes) {
        this.measurementDate = measurementDate;
        this.millimeters = millimeters;
        this.notes = notes;
    }

    @PrePersist void prePersist() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
    @PreUpdate void preUpdate() { updatedAt = OffsetDateTime.now(ZoneOffset.UTC); }

    public UUID getId() { return id; }
    public Planting getPlanting() { return planting; }
    public LocalDate getMeasurementDate() { return measurementDate; }
    public BigDecimal getMillimeters() { return millimeters; }
    public String getNotes() { return notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
