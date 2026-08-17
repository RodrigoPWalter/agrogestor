package br.com.agrogestor.expense.entity;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planting_id")
    private Planting planting;

    @Column(nullable = false, length = 160)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpenseCategory category;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(length = 1000)
    private String observations;

    @Column(name = "fuel_liters", precision = 14, scale = 3)
    private BigDecimal fuelLiters;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpenseOrigin origin;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Expense() {
    }

    public Expense(
            Property property,
            Planting planting,
            String description,
            ExpenseCategory category,
            BigDecimal amount,
            LocalDate expenseDate,
            String observations
    ) {
        this(property, planting, description, category, amount, expenseDate,
                observations, ExpenseOrigin.DIRECT);
    }

    public Expense(
            Property property,
            Planting planting,
            String description,
            ExpenseCategory category,
            BigDecimal amount,
            LocalDate expenseDate,
            String observations,
            ExpenseOrigin origin
    ) {
        this(property, planting, description, category, amount, expenseDate,
                observations, origin, null);
    }

    public Expense(
            Property property,
            Planting planting,
            String description,
            ExpenseCategory category,
            BigDecimal amount,
            LocalDate expenseDate,
            String observations,
            ExpenseOrigin origin,
            BigDecimal fuelLiters
    ) {
        this.property = property;
        this.origin = origin;
        update(planting, description, category, amount, expenseDate, observations, fuelLiters);
    }

    public void update(
            Planting planting,
            String description,
            ExpenseCategory category,
            BigDecimal amount,
            LocalDate expenseDate,
            String observations
    ) {
        update(planting, description, category, amount, expenseDate, observations, null);
    }

    public void update(
            Planting planting,
            String description,
            ExpenseCategory category,
            BigDecimal amount,
            LocalDate expenseDate,
            String observations,
            BigDecimal fuelLiters
    ) {
        this.planting = planting;
        this.description = description;
        this.category = category;
        this.amount = amount;
        this.expenseDate = expenseDate;
        this.observations = observations;
        this.fuelLiters = category == ExpenseCategory.FUEL ? fuelLiters : null;
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

    public Property getProperty() {
        return property;
    }

    public Planting getPlanting() {
        return planting;
    }

    public String getDescription() {
        return description;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public String getObservations() {
        return observations;
    }

    public BigDecimal getFuelLiters() {
        return fuelLiters;
    }

    public ExpenseOrigin getOrigin() {
        return origin;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
