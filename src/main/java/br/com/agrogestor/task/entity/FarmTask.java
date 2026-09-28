package br.com.agrogestor.task.entity;

import br.com.agrogestor.machine.entity.Machine;
import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.property.entity.Property;
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
import java.util.UUID;

@Entity
@Table(name = "farm_tasks")
public class FarmTask {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planting_id")
    private Planting planting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id")
    private Machine machine;

    @Column(nullable = false, length = 160)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FarmTaskCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FarmTaskStatus status = FarmTaskStatus.PENDING;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "estimated_duration_minutes", nullable = false)
    private Integer estimatedDurationMinutes;

    @Column(length = 1000)
    private String notes;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected FarmTask() {
    }

    public FarmTask(
            Property property,
            Planting planting,
            Machine machine,
            String title,
            FarmTaskCategory category,
            LocalDate dueDate,
            Integer estimatedDurationMinutes,
            String notes
    ) {
        this.property = property;
        update(planting, machine, title, category, dueDate, estimatedDurationMinutes, notes);
    }

    public void update(
            Planting planting,
            Machine machine,
            String title,
            FarmTaskCategory category,
            LocalDate dueDate,
            Integer estimatedDurationMinutes,
            String notes
    ) {
        this.planting = planting;
        this.machine = machine;
        this.title = title;
        this.category = category;
        this.dueDate = dueDate;
        this.estimatedDurationMinutes = estimatedDurationMinutes;
        this.notes = notes;
    }

    public void changeStatus(FarmTaskStatus nextStatus) {
        status = nextStatus;
        completedAt = nextStatus == FarmTaskStatus.COMPLETED
                ? OffsetDateTime.now(ZoneOffset.UTC)
                : null;
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
    public Machine getMachine() { return machine; }
    public String getTitle() { return title; }
    public FarmTaskCategory getCategory() { return category; }
    public FarmTaskStatus getStatus() { return status; }
    public LocalDate getDueDate() { return dueDate; }
    public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public String getNotes() { return notes; }
    public OffsetDateTime getCompletedAt() { return completedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
