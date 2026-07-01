package br.com.agrogestor.weather.controller;

import br.com.agrogestor.weather.dto.WeatherForecastResponse;
import br.com.agrogestor.weather.service.WeatherService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/weather")
@Tag(name = "Clima", description = "Previsão meteorológica da propriedade")
public class WeatherController {

    private final WeatherService service;

    public WeatherController(WeatherService service) {
        this.service = service;
    }

    @GetMapping("/forecast")
    public WeatherForecastResponse forecast() {
        return service.forecast();
    }
}
