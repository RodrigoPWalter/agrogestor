package br.com.agrogestor.weather.client;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

public record GeocodingResponse(List<Result> results) {
    public record Result(
            String name,
            BigDecimal latitude,
            BigDecimal longitude,
            String timezone,
            String country,
            @JsonProperty("admin1") String region
    ) {
    }
}
