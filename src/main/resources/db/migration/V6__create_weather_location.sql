CREATE TABLE weather_location (
    id SMALLINT PRIMARY KEY,
    city VARCHAR(120) NOT NULL,
    region VARCHAR(120),
    country VARCHAR(120) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_weather_location_singleton CHECK (id = 1)
);
