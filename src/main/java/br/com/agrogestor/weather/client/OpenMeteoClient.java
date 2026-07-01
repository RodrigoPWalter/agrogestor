package br.com.agrogestor.weather.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OpenMeteoClient {
    public static final String SOURCE_URL = "https://open-meteo.com/";
    private final RestClient restClient;
    private final double latitude;
    private final double longitude;

    public OpenMeteoClient(
            RestClient.Builder builder,
            @Value("${agrogestor.weather.latitude}") double latitude,
            @Value("${agrogestor.weather.longitude}") double longitude
    ) {
        this.restClient = builder.baseUrl("https://api.open-meteo.com").build();
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public OpenMeteoResponse fetch() {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/forecast")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam("current", "temperature_2m,apparent_temperature,weather_code")
                        .queryParam("daily", "temperature_2m_min,temperature_2m_max,"
                                + "precipitation_probability_max,precipitation_sum,weather_code")
                        .queryParam("timezone", "America/Sao_Paulo")
                        .queryParam("forecast_days", 5)
                        .build())
                .retrieve()
                .body(OpenMeteoResponse.class);
    }
}
