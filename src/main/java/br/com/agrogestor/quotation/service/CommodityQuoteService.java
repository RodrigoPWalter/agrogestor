package br.com.agrogestor.quotation.service;

import br.com.agrogestor.quotation.client.CotricampoQuoteClient;
import br.com.agrogestor.quotation.dto.CommodityQuotesResponse;
import br.com.agrogestor.shared.exception.ExternalServiceException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class CommodityQuoteService {

    private static final Duration CACHE_DURATION = Duration.ofMinutes(15);

    private final CotricampoQuoteClient client;
    private volatile CommodityQuotesResponse cachedQuotes;

    public CommodityQuoteService(CotricampoQuoteClient client) {
        this.client = client;
    }

    public CommodityQuotesResponse findLatest() {
        CommodityQuotesResponse currentCache = cachedQuotes;
        if (isFresh(currentCache)) {
            return currentCache;
        }

        synchronized (this) {
            currentCache = cachedQuotes;
            if (isFresh(currentCache)) {
                return currentCache;
            }

            try {
                CommodityQuotesResponse freshQuotes = client.fetchLatest();
                cachedQuotes = freshQuotes;
                return freshQuotes;
            } catch (Exception exception) {
                if (currentCache != null) {
                    return currentCache.asStale();
                }
                throw new ExternalServiceException(
                        "As cotações estão temporariamente indisponíveis",
                        exception
                );
            }
        }
    }

    private boolean isFresh(CommodityQuotesResponse response) {
        return response != null
                && response.fetchedAt()
                .plus(CACHE_DURATION)
                .isAfter(OffsetDateTime.now(ZoneOffset.UTC));
    }
}
