package br.com.agrogestor.weather.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record WeatherDayResponse(
        LocalDate date,
        BigDecimal minimumTemperature,
        BigDecimal maximumTemperature,
        Integer rainProbability,
        BigDecimal expectedRainMillimeters,
        Integer weatherCode,
        String condition
) {}
