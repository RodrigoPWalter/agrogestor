package br.com.agrogestor.weather.service;

import br.com.agrogestor.shared.exception.ExternalServiceException;
import br.com.agrogestor.weather.client.OpenMeteoClient;
import br.com.agrogestor.weather.dto.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class WeatherService {
    private static final Duration CACHE_DURATION = Duration.ofMinutes(30);
    private final OpenMeteoClient client;
    private final WeatherLocationService locationService;
    private volatile WeatherForecastResponse cachedForecast;
    private volatile String cachedLocationKey;

    public WeatherService(OpenMeteoClient client, WeatherLocationService locationService) {
        this.client = client;
        this.locationService = locationService;
    }

    public WeatherForecastResponse forecast() {
        var location = locationService.current();
        String locationKey = location.latitude() + ":" + location.longitude();
        WeatherForecastResponse current = cachedForecast;
        if (isFresh(current) && locationKey.equals(cachedLocationKey)) return current;

        synchronized (this) {
            current = cachedForecast;
            if (isFresh(current) && locationKey.equals(cachedLocationKey)) return current;
            try {
                var source = client.fetch(
                        location.latitude().doubleValue(),
                        location.longitude().doubleValue(),
                        location.timezone()
                );
                if (source == null || source.current() == null || source.daily() == null) {
                    throw new IllegalStateException("Resposta meteorológica incompleta");
                }
                var days = mapDays(source.daily());
                var response = new WeatherForecastResponse(
                        location.label(), source.current().temperature(),
                        source.current().apparentTemperature(), source.current().weatherCode(),
                        condition(source.current().weatherCode()), days, alerts(days),
                        "Open-Meteo", OpenMeteoClient.SOURCE_URL,
                        OffsetDateTime.now(ZoneOffset.UTC), false
                );
                cachedForecast = response;
                cachedLocationKey = locationKey;
                return response;
            } catch (Exception exception) {
                if (current != null) return current.asStale();
                throw new ExternalServiceException(
                        "A previsão do tempo está temporariamente indisponível", exception);
            }
        }
    }

    private List<WeatherDayResponse> mapDays(br.com.agrogestor.weather.client.OpenMeteoResponse.Daily daily) {
        List<WeatherDayResponse> days = new ArrayList<>();
        for (int index = 0; index < daily.time().size(); index++) {
            days.add(new WeatherDayResponse(
                    daily.time().get(index), daily.minimumTemperatures().get(index),
                    daily.maximumTemperatures().get(index), daily.rainProbabilities().get(index),
                    daily.precipitationSums().get(index), daily.weatherCodes().get(index),
                    condition(daily.weatherCodes().get(index))
            ));
        }
        return days;
    }

    private List<WeatherAlertResponse> alerts(List<WeatherDayResponse> days) {
        List<WeatherAlertResponse> alerts = new ArrayList<>();
        boolean frost = days.stream().anyMatch(day ->
                day.minimumTemperature().compareTo(BigDecimal.valueOf(3)) <= 0);
        boolean heat = days.stream().anyMatch(day ->
                day.maximumTemperature().compareTo(BigDecimal.valueOf(35)) >= 0);
        boolean heavyRain = days.stream().anyMatch(day ->
                day.expectedRainMillimeters().compareTo(BigDecimal.valueOf(40)) >= 0);
        if (frost) alerts.add(new WeatherAlertResponse(
                "FROST", "HIGH", "Risco de geada nos próximos dias"));
        if (heat) alerts.add(new WeatherAlertResponse(
                "HEAT", "HIGH", "Temperaturas muito elevadas previstas"));
        if (heavyRain) alerts.add(new WeatherAlertResponse(
                "HEAVY_RAIN", "MEDIUM", "Volume elevado de chuva previsto"));
        return alerts;
    }

    private String condition(Integer code) {
        if (code == null) return "Condição indisponível";
        if (code == 0) return "Céu limpo";
        if (code <= 3) return "Parcialmente nublado";
        if (code == 45 || code == 48) return "Neblina";
        if (code <= 57) return "Garoa";
        if (code <= 67) return "Chuva";
        if (code <= 77) return "Neve";
        if (code <= 82) return "Pancadas de chuva";
        return "Tempestade";
    }

    private boolean isFresh(WeatherForecastResponse response) {
        return response != null && response.fetchedAt().plus(CACHE_DURATION)
                .isAfter(OffsetDateTime.now(ZoneOffset.UTC));
    }
}
