package br.com.agrogestor.quotation.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record CommodityQuotesResponse(
        LocalDate quotationDate,
        List<CommodityQuoteItemResponse> quotes,
        List<MarketQuoteHistoryResponse> history,
        String sourceName,
        String sourceUrl,
        OffsetDateTime fetchedAt,
        boolean stale
) {
    public CommodityQuotesResponse asStale() {
        return new CommodityQuotesResponse(
                quotationDate,
                quotes,
                history,
                sourceName,
                sourceUrl,
                fetchedAt,
                true
        );
    }
}
