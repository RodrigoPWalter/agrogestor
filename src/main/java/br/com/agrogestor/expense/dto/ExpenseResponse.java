package br.com.agrogestor.expense.dto;

import br.com.agrogestor.expense.entity.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        UUID plantingId,
        String plantingCrop,
        String plantingHarvest,
        String description,
        ExpenseCategory category,
        String categoryDisplayName,
        BigDecimal amount,
        LocalDate expenseDate,
        String observations,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
