package br.com.agrogestor.weather.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record WeatherForecastResponse(
        String location,
        BigDecimal currentTemperature,
        BigDecimal apparentTemperature,
        Integer currentWeatherCode,
        String currentCondition,
        List<WeatherDayResponse> days,
        List<WeatherAlertResponse> alerts,
        String sourceName,
        String sourceUrl,
        OffsetDateTime fetchedAt,
        boolean stale
) {
    public WeatherForecastResponse asStale() {
        return new WeatherForecastResponse(
                location, currentTemperature, apparentTemperature, currentWeatherCode,
                currentCondition, days, alerts, sourceName, sourceUrl, fetchedAt, true
        );
    }
}
