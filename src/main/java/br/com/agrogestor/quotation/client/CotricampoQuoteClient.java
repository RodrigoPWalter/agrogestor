package br.com.agrogestor.quotation.client;

import br.com.agrogestor.quotation.dto.CommodityQuoteItemResponse;
import br.com.agrogestor.quotation.dto.CommodityQuotesResponse;
import br.com.agrogestor.quotation.dto.MarketQuoteHistoryResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class CotricampoQuoteClient {

    static final String SOURCE_URL = "https://www.cotricampo.com.br/servicos/cotacoes";
    private static final Set<String> DESIRED_COMMODITIES =
            Set.of("SOJA", "MILHO", "TRIGO", "DIESEL");
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/uuuu");
    private static final Pattern DATE_PATTERN = Pattern.compile("\\d{2}/\\d{2}/\\d{4}");

    public CommodityQuotesResponse fetchLatest() throws IOException {
        // TODO: trocar o parser por uma API oficial se a Cotricampo disponibilizar uma.
        Document document = Jsoup.connect(SOURCE_URL)
                .userAgent("AgroGestor/0.1 (+portfolio educacional)")
                .timeout(7_000)
                .get();
        return parse(document);
    }

    CommodityQuotesResponse parse(Document document) {
        var parsedDates = new HashSet<LocalDate>();
        List<MarketQuoteHistoryResponse> history = document
                .select(".lista_card_cotacao_interna")
                .stream()
                .map(this::parseQuotationBlock)
                .filter(item -> parsedDates.add(item.quotationDate()))
                .toList();
        if (history.isEmpty()) {
            throw new IllegalStateException("A página não contém cotações");
        }

        MarketQuoteHistoryResponse latest = history.getFirst();
        return new CommodityQuotesResponse(
                latest.quotationDate(),
                latest.quotes(),
                history,
                "Cotricampo",
                SOURCE_URL,
                OffsetDateTime.now(ZoneOffset.UTC),
                false
        );
    }

    private MarketQuoteHistoryResponse parseQuotationBlock(Element quotationBlock) {
        Element dateElement = quotationBlock.selectFirst(".titulo_data");
        if (dateElement == null) {
            throw new IllegalStateException("A cotação não possui data");
        }
        List<CommodityQuoteItemResponse> quotes = quotationBlock
                .select(".card_cotacao")
                .stream()
                .map(this::parseQuote)
                .filter(item -> DESIRED_COMMODITIES.contains(
                        item.commodity().toUpperCase(Locale.ROOT)
                ))
                .toList();

        if (quotes.size() != DESIRED_COMMODITIES.size()) {
            throw new IllegalStateException("Nem todas as cotações esperadas foram encontradas");
        }

        var dateMatcher = DATE_PATTERN.matcher(dateElement.text());
        if (!dateMatcher.find()) {
            throw new IllegalStateException("A cotação possui uma data inválida");
        }

        return new MarketQuoteHistoryResponse(
                LocalDate.parse(dateMatcher.group(), DATE_FORMATTER),
                quotes
        );
    }

    private CommodityQuoteItemResponse parseQuote(Element card) {
        Element nameElement = card.selectFirst(".card_coluna_1 p");
        Element priceElement = card.selectFirst(".card_coluna_2 p");
        if (nameElement == null || priceElement == null) {
            throw new IllegalStateException("Cotação com formato inválido");
        }

        String normalizedPrice = priceElement.text()
                .replace("R$", "")
                .replace(".", "")
                .replace(",", ".")
                .strip();

        return new CommodityQuoteItemResponse(
                nameElement.text().strip(),
                new BigDecimal(normalizedPrice)
        );
    }
}
