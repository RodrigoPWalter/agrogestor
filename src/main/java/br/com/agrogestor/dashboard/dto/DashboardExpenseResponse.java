package br.com.agrogestor.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DashboardExpenseResponse(
        UUID id,
        String description,
        String categoryDisplayName,
        BigDecimal amount,
        LocalDate expenseDate
) {
}
