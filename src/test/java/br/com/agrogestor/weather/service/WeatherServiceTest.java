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
        WeatherLocationService locationService = mock(WeatherLocationService.class);
        var daily = new OpenMeteoResponse.Daily(
                List.of(LocalDate.of(2026, 7, 2), LocalDate.of(2026, 7, 3)),
                List.of(new BigDecimal("2.0"), new BigDecimal("18.0")),
                List.of(new BigDecimal("15.0"), new BigDecimal("36.0")),
                List.of(80, 20),
                List.of(new BigDecimal("5.0"), BigDecimal.ZERO),
                List.of(61, 1)
        );
        when(locationService.current()).thenReturn(
                new br.com.agrogestor.weather.dto.WeatherLocationResponse(
                        "Campo Novo", "Rio Grande do Sul", "Brasil",
                        new BigDecimal("-27.67"), new BigDecimal("-53.80"),
                        "America/Sao_Paulo"
                )
        );
        when(client.fetch(anyDouble(), anyDouble(), anyString())).thenReturn(new OpenMeteoResponse(
                new OpenMeteoResponse.Current(
                        new BigDecimal("12.0"), new BigDecimal("10.0"), 2),
                daily
        ));
        var service = new WeatherService(client, locationService);

        var first = service.forecast();
        var second = service.forecast();

        assertThat(first.location()).isEqualTo("Campo Novo - Rio Grande do Sul");
        assertThat(first.days()).hasSize(2);
        assertThat(first.alerts()).extracting(alert -> alert.type())
                .containsExactlyInAnyOrder("FROST", "HEAT");
        assertThat(second).isSameAs(first);
        verify(client, times(1)).fetch(anyDouble(), anyDouble(), anyString());
    }

    @Test
    void shouldUseSecondarySourceWhenOpenMeteoIsUnavailable() {
        OpenMeteoClient client = mock(OpenMeteoClient.class);
        MetNoClient fallbackClient = mock(MetNoClient.class);
        WeatherLocationService locationService = mock(WeatherLocationService.class);
        when(locationService.current()).thenReturn(
                new br.com.agrogestor.weather.dto.WeatherLocationResponse(
                        "Crissiumal - RS", null, "Brasil",
                        new BigDecimal("-27.49972"), new BigDecimal("-54.10111"),
                        "America/Sao_Paulo"
                )
        );
        when(client.fetch(anyDouble(), anyDouble(), anyString()))
                .thenThrow(new IllegalStateException("timeout"));
        when(fallbackClient.fetch(anyDouble(), anyDouble(), anyString()))
                .thenReturn(new OpenMeteoResponse(
                        new OpenMeteoResponse.Current(
                                new BigDecimal("8.0"), new BigDecimal("8.0"), 2),
                        new OpenMeteoResponse.Daily(
                                List.of(LocalDate.of(2026, 7, 3)),
                                List.of(new BigDecimal("5.0")),
                                List.of(new BigDecimal("16.0")),
                                List.of(0),
                                List.of(BigDecimal.ZERO),
                                List.of(2)
                        )
                ));

        var response = new WeatherService(client, fallbackClient, locationService)
                .forecast();

        assertThat(response.location()).isEqualTo("Crissiumal - RS");
        assertThat(response.sourceName()).isEqualTo("MET Norway");
        verify(fallbackClient).fetch(anyDouble(), anyDouble(), anyString());
    }
}
