package br.com.agrogestor.diary.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class FieldDiaryBoletoJsonTest {
    @Test
    void readsBoletoFieldsFromPurchaseRequest() throws Exception {
        ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
        FieldDiaryRequest request = mapper.readValue("""
                {"entryDate":"2026-11-01","activityType":"PRODUCT_PURCHASE",
                 "boletoDueDate":"2026-12-15","boletoName":"João"}
                """, FieldDiaryRequest.class);
        assertThat(request.boletoDueDate()).isEqualTo(LocalDate.of(2026, 12, 15));
        assertThat(request.boletoName()).isEqualTo("João");
    }
}
