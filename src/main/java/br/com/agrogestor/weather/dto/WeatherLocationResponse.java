package br.com.agrogestor.weather.dto;

import java.math.BigDecimal;

public record WeatherLocationResponse(
        String city,
        String region,
        String country,
        BigDecimal latitude,
        BigDecimal longitude,
        String timezone
) {
    public String label() {
        return region == null || region.isBlank() ? city : city + " - " + region;
    }
}
