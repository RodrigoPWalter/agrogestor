package br.com.agrogestor.weather.dto;

public record WeatherAlertResponse(
        String type,
        String severity,
        String message
) {}
