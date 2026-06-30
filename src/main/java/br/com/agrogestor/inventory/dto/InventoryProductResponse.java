package br.com.agrogestor.inventory.dto;

import br.com.agrogestor.inventory.entity.MeasurementUnit;
import br.com.agrogestor.inventory.entity.ProductType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record InventoryProductResponse(
        UUID id, String name, ProductType productType, String productTypeName,
        BigDecimal quantity, MeasurementUnit unit, String unitName,
        BigDecimal minimumStock, LocalDate expirationDate,
        boolean lowStock, boolean expired,
        OffsetDateTime createdAt, OffsetDateTime updatedAt
) {
}
