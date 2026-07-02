CREATE TABLE rainfall_measurements (
    id UUID PRIMARY KEY,
    measurement_date DATE NOT NULL UNIQUE,
    millimeters NUMERIC(8, 2) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_rainfall_millimeters_non_negative CHECK (millimeters >= 0)
);

CREATE INDEX idx_rainfall_measurement_date
    ON rainfall_measurements (measurement_date DESC);
