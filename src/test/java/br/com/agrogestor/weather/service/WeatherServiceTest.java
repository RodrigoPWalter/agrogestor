package br.com.agrogestor.weather.service;

import br.com.agrogestor.weather.client.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class WeatherServiceTest {

    @Test
    void shouldMapForecastCreateAlertsAndCacheResponse() {
        OpenMeteoClient client = mock(OpenMeteoClient.class);
        var daily = new OpenMeteoResponse.Daily(
                List.of(LocalDate.of(2026, 7, 2), LocalDate.of(2026, 7, 3)),
                List.of(new BigDecimal("2.0"), new BigDecimal("18.0")),
                List.of(new BigDecimal("15.0"), new BigDecimal("36.0")),
                List.of(80, 20),
                List.of(new BigDecimal("5.0"), BigDecimal.ZERO),
                List.of(61, 1)
        );
        when(client.fetch()).thenReturn(new OpenMeteoResponse(
                new OpenMeteoResponse.Current(
                        new BigDecimal("12.0"), new BigDecimal("10.0"), 2),
                daily
        ));
        var service = new WeatherService(client, "Campo Novo - RS");

        var first = service.forecast();
        var second = service.forecast();

        assertThat(first.location()).isEqualTo("Campo Novo - RS");
        assertThat(first.days()).hasSize(2);
        assertThat(first.alerts()).extracting(alert -> alert.type())
                .containsExactlyInAnyOrder("FROST", "HEAT");
        assertThat(second).isSameAs(first);
        verify(client, times(1)).fetch();
    }
}
