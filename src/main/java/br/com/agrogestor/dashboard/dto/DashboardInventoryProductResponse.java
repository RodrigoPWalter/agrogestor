package br.com.agrogestor.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DashboardInventoryProductResponse(
        UUID id,
        String name,
        String productTypeName,
        BigDecimal quantity,
        String unitName,
        LocalDate expirationDate,
        boolean lowStock
) {
}
