package br.com.agrogestor.weather.service;

import br.com.agrogestor.weather.client.GeocodingClient;
import br.com.agrogestor.weather.dto.WeatherLocationRequest;
import br.com.agrogestor.weather.dto.WeatherLocationResponse;
import br.com.agrogestor.weather.entity.WeatherLocation;
import br.com.agrogestor.weather.repository.WeatherLocationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WeatherLocationService {

    private final WeatherLocationRepository repository;
    private final GeocodingClient geocodingClient;
    private final WeatherLocationResponse defaultLocation;

    public WeatherLocationService(
            WeatherLocationRepository repository,
            GeocodingClient geocodingClient,
            @Value("${agrogestor.weather.latitude}") BigDecimal defaultLatitude,
            @Value("${agrogestor.weather.longitude}") BigDecimal defaultLongitude,
            @Value("${agrogestor.weather.location-name}") String defaultName
    ) {
        this.repository = repository;
        this.geocodingClient = geocodingClient;
        this.defaultLocation = new WeatherLocationResponse(
                defaultName,
                null,
                "Brasil",
                defaultLatitude,
                defaultLongitude,
                "America/Sao_Paulo"
        );
    }

    public List<WeatherLocationResponse> search(String query) {
        var response = geocodingClient.search(query.trim());
        if (response == null || response.results() == null) {
            return List.of();
        }
        return response.results().stream()
                .map(result -> new WeatherLocationResponse(
                        result.name(),
                        result.region(),
                        result.country(),
                        result.latitude(),
                        result.longitude(),
                        result.timezone()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public WeatherLocationResponse current() {
        return repository.findById(WeatherLocation.SINGLETON_ID)
                .map(this::toResponse)
                .orElse(defaultLocation);
    }

    @Transactional
    public WeatherLocationResponse select(WeatherLocationRequest request) {
        WeatherLocation location = repository
                .findById(WeatherLocation.SINGLETON_ID)
                .orElseGet(() -> new WeatherLocation(
                        request.city(),
                        request.region(),
                        request.country(),
                        request.latitude(),
                        request.longitude(),
                        request.timezone()
                ));
        location.update(
                request.city().trim(),
                normalizeNullable(request.region()),
                request.country().trim(),
                request.latitude(),
                request.longitude(),
                request.timezone().trim()
        );
        return toResponse(repository.save(location));
    }

    private WeatherLocationResponse toResponse(WeatherLocation location) {
        return new WeatherLocationResponse(
                location.getCity(),
                location.getRegion(),
                location.getCountry(),
                location.getLatitude(),
                location.getLongitude(),
                location.getTimezone()
        );
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
