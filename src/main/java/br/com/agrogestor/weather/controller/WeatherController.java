package br.com.agrogestor.weather.controller;

import br.com.agrogestor.weather.dto.WeatherForecastResponse;
import br.com.agrogestor.weather.dto.WeatherLocationRequest;
import br.com.agrogestor.weather.dto.WeatherLocationResponse;
import br.com.agrogestor.weather.service.WeatherLocationService;
import br.com.agrogestor.weather.service.WeatherService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/weather")
@Tag(name = "Clima", description = "Previsão meteorológica da propriedade")
public class WeatherController {

    private final WeatherService service;
    private final WeatherLocationService locationService;

    public WeatherController(
            WeatherService service,
            WeatherLocationService locationService
    ) {
        this.service = service;
        this.locationService = locationService;
    }

    @GetMapping("/forecast")
    public WeatherForecastResponse forecast() {
        return service.forecast();
    }

    @GetMapping("/locations/search")
    public List<WeatherLocationResponse> searchLocations(
            @RequestParam @Size(min = 3, max = 80) String query
    ) {
        return locationService.search(query);
    }

    @GetMapping("/location")
    public WeatherLocationResponse currentLocation() {
        return locationService.current();
    }

    @PutMapping("/location")
    public WeatherLocationResponse selectLocation(
            @Valid @RequestBody WeatherLocationRequest request
    ) {
        return locationService.select(request);
    }
}
