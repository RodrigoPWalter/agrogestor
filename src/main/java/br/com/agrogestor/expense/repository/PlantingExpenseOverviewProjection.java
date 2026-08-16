package br.com.agrogestor.expense.repository;

import java.math.BigDecimal;
import java.util.UUID;

public interface PlantingExpenseOverviewProjection {

    UUID getPlantingId();

    BigDecimal getPlannedAreaHectares();

    BigDecimal getTotalExpenses();

    long getExpenseCount();
}
