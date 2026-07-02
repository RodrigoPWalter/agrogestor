package br.com.agrogestor.weather.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OpenMeteoClient {
    public static final String SOURCE_URL = "https://open-meteo.com/";
    private final RestClient restClient;

    public OpenMeteoClient(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("https://api.open-meteo.com").build();
    }

    public OpenMeteoResponse fetch(double latitude, double longitude, String timezone) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/forecast")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam("current", "temperature_2m,apparent_temperature,weather_code")
                        .queryParam("daily", "temperature_2m_min,temperature_2m_max,"
                                + "precipitation_probability_max,precipitation_sum,weather_code")
                        .queryParam("timezone", timezone)
                        .queryParam("forecast_days", 5)
                        .build())
                .retrieve()
                .body(OpenMeteoResponse.class);
    }
}
