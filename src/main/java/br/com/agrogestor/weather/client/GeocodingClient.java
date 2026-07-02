package br.com.agrogestor.weather.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class GeocodingClient {

    private final RestClient restClient;

    public GeocodingClient(RestClient.Builder builder) {
        restClient = builder.baseUrl("https://geocoding-api.open-meteo.com").build();
    }

    public GeocodingResponse search(String query) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/search")
                        .queryParam("name", query)
                        .queryParam("count", 8)
                        .queryParam("language", "pt")
                        .queryParam("countryCode", "BR")
                        .build())
                .retrieve()
                .body(GeocodingResponse.class);
    }
}
