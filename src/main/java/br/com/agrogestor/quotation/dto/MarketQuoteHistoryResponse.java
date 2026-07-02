package br.com.agrogestor.quotation.dto;

import java.time.LocalDate;
import java.util.List;

public record MarketQuoteHistoryResponse(
        LocalDate quotationDate,
        List<CommodityQuoteItemResponse> quotes
) {}
