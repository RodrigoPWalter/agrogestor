package br.com.agrogestor.weather.client;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record OpenMeteoResponse(Current current, Daily daily) {
    public record Current(
            @JsonProperty("temperature_2m") BigDecimal temperature,
            @JsonProperty("apparent_temperature") BigDecimal apparentTemperature,
            @JsonProperty("weather_code") Integer weatherCode
    ) {}

    public record Daily(
            List<LocalDate> time,
            @JsonProperty("temperature_2m_min") List<BigDecimal> minimumTemperatures,
            @JsonProperty("temperature_2m_max") List<BigDecimal> maximumTemperatures,
            @JsonProperty("precipitation_probability_max") List<Integer> rainProbabilities,
            @JsonProperty("precipitation_sum") List<BigDecimal> precipitationSums,
            @JsonProperty("weather_code") List<Integer> weatherCodes
    ) {}
}
