package br.com.agrogestor.machine.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "maintenances")
public class Maintenance {
    @Id @GeneratedValue
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;
    @Column(name = "maintenance_date", nullable = false)
    private LocalDate maintenanceDate;
    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false, length = 20)
    private MaintenanceType maintenanceType;
    @Column(name = "replaced_parts", length = 1000)
    private String replacedParts;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal cost;
    @Column(name = "next_review_hours", precision = 12, scale = 1)
    private BigDecimal nextReviewHours;
    @Column(length = 1000)
    private String notes;
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Maintenance() {}

    public Maintenance(Machine machine, LocalDate maintenanceDate, MaintenanceType maintenanceType,
                       String replacedParts, BigDecimal cost, BigDecimal nextReviewHours, String notes) {
        update(machine, maintenanceDate, maintenanceType, replacedParts, cost, nextReviewHours, notes);
    }

    public void update(Machine machine, LocalDate maintenanceDate, MaintenanceType maintenanceType,
                       String replacedParts, BigDecimal cost, BigDecimal nextReviewHours, String notes) {
        this.machine = machine;
        this.maintenanceDate = maintenanceDate;
        this.maintenanceType = maintenanceType;
        this.replacedParts = replacedParts;
        this.cost = cost;
        this.nextReviewHours = nextReviewHours;
        this.notes = notes;
    }

    @PrePersist void prePersist() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
    @PreUpdate void preUpdate() { updatedAt = OffsetDateTime.now(ZoneOffset.UTC); }

    public UUID getId() { return id; }
    public Machine getMachine() { return machine; }
    public LocalDate getMaintenanceDate() { return maintenanceDate; }
    public MaintenanceType getMaintenanceType() { return maintenanceType; }
    public String getReplacedParts() { return replacedParts; }
    public BigDecimal getCost() { return cost; }
    public BigDecimal getNextReviewHours() { return nextReviewHours; }
    public String getNotes() { return notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
