package br.com.agrogestor.weather.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "weather_location")
public class WeatherLocation {

    public static final short SINGLETON_ID = 1;

    @Id
    private Short id = SINGLETON_ID;

    @Column(nullable = false, length = 120)
    private String city;

    @Column(length = 120)
    private String region;

    @Column(nullable = false, length = 120)
    private String country;

    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(nullable = false, length = 80)
    private String timezone;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected WeatherLocation() {
    }

    public WeatherLocation(
            String city,
            String region,
            String country,
            BigDecimal latitude,
            BigDecimal longitude,
            String timezone
    ) {
        update(city, region, country, latitude, longitude, timezone);
    }

    public void update(
            String city,
            String region,
            String country,
            BigDecimal latitude,
            BigDecimal longitude,
            String timezone
    ) {
        this.city = city;
        this.region = region;
        this.country = country;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timezone = timezone;
    }

    @PrePersist
    @PreUpdate
    void touch() {
        id = SINGLETON_ID;
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public String getCity() { return city; }
    public String getRegion() { return region; }
    public String getCountry() { return country; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public String getTimezone() { return timezone; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
