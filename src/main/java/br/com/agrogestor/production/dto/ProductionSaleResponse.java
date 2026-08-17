package br.com.agrogestor.production.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductionSaleResponse(
        UUID id,
        UUID plantingId,
        LocalDate saleDate,
        BigDecimal quantityBags,
        BigDecimal pricePerBag,
        BigDecimal totalAmount,
        String buyer,
        String observations,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
