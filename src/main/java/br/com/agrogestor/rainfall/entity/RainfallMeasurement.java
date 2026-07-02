package br.com.agrogestor.rainfall.entity;

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
    @Column(name = "measurement_date", nullable = false, unique = true)
    private LocalDate measurementDate;
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
    public LocalDate getMeasurementDate() { return measurementDate; }
    public BigDecimal getMillimeters() { return millimeters; }
    public String getNotes() { return notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
