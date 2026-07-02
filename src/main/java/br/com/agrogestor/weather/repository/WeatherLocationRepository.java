package br.com.agrogestor.weather.repository;

import br.com.agrogestor.weather.entity.WeatherLocation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeatherLocationRepository extends JpaRepository<WeatherLocation, Short> {
}
