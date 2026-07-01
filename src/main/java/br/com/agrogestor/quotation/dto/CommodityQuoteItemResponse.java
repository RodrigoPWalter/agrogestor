package br.com.agrogestor.quotation.dto;

import java.math.BigDecimal;

public record CommodityQuoteItemResponse(
        String commodity,
        BigDecimal price
) {
}
