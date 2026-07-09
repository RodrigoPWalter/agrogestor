package br.com.agrogestor.planting.dto;

import java.math.BigDecimal;

public record HarvestTotalResponse(
        String unit,
        BigDecimal quantity
) {
}
