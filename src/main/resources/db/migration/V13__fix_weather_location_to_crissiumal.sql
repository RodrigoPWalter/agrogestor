INSERT INTO weather_location (
    id,
    city,
    region,
    country,
    latitude,
    longitude,
    timezone,
    updated_at
) VALUES (
    1,
    'Crissiumal',
    'Rio Grande do Sul',
    'Brasil',
    -27.499720,
    -54.101110,
    'America/Sao_Paulo',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    city = EXCLUDED.city,
    region = EXCLUDED.region,
    country = EXCLUDED.country,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    timezone = EXCLUDED.timezone,
    updated_at = CURRENT_TIMESTAMP;
