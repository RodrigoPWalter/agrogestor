package br.com.agrogestor.production.dto;

import br.com.agrogestor.planting.entity.PlantingStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductionStockResponse(
        UUID plantingId,
        String crop,
        String harvest,
        String fieldName,
        PlantingStatus plantingStatus,
        BigDecimal harvestedBags,
        BigDecimal soldBags,
        BigDecimal availableBags,
        BigDecimal revenue,
        BigDecimal averageSalePrice,
        long saleCount
) {
}
