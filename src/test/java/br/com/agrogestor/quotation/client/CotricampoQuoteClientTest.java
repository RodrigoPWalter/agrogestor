package br.com.agrogestor.quotation.client;

import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CotricampoQuoteClientTest {

    private final CotricampoQuoteClient client = new CotricampoQuoteClient();

    @Test
    void shouldParseLatestAgriculturalQuotes() {
        var document = Jsoup.parse("""
                <div class="lista_card_cotacao_interna">
                  <div class="titulo_data">
                    <svg><style>.calendar{fill:green}</style></svg>
                    01/07/2026
                  </div>
                  <div class="coluna_cotacao">
                    <div class="titulo">AGRÍCOLA</div>
                    <div class="card_cotacao">
                      <div class="card_coluna_1"><p>Soja</p></div>
                      <div class="card_coluna_2"><p>R$ 118,00</p></div>
                    </div>
                    <div class="card_cotacao">
                      <div class="card_coluna_1"><p>Milho</p></div>
                      <div class="card_coluna_2"><p>R$ 58,00</p></div>
                    </div>
                    <div class="card_cotacao">
                      <div class="card_coluna_1"><p>Trigo</p></div>
                      <div class="card_coluna_2"><p>R$ 70,00</p></div>
                    </div>
                  </div>
                  <div class="coluna_cotacao">
                    <div class="titulo">COMBUSTÍVEIS</div>
                    <div class="card_cotacao">
                      <div class="card_coluna_1"><p>Diesel</p></div>
                      <div class="card_coluna_2"><p>R$ 6,59</p></div>
                    </div>
                  </div>
                </div>
                """);

        var response = client.parse(document);

        assertThat(response.quotationDate()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(response.quotes())
                .extracting(item -> item.commodity().toUpperCase(), item -> item.price())
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("SOJA", new BigDecimal("118.00")),
                        org.assertj.core.groups.Tuple.tuple("MILHO", new BigDecimal("58.00")),
                        org.assertj.core.groups.Tuple.tuple("TRIGO", new BigDecimal("70.00")),
                        org.assertj.core.groups.Tuple.tuple("DIESEL", new BigDecimal("6.59"))
                );
        assertThat(response.history()).hasSize(1);
        assertThat(response.sourceUrl()).isEqualTo(CotricampoQuoteClient.SOURCE_URL);
        assertThat(response.stale()).isFalse();
    }
}
