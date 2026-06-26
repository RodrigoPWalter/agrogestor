CREATE TABLE plantings (
    id UUID PRIMARY KEY,
    crop VARCHAR(80) NOT NULL,
    harvest VARCHAR(9) NOT NULL,
    planted_area_hectares NUMERIC(12, 2) NOT NULL,
    planting_date DATE NOT NULL,
    seed_variety VARCHAR(120) NOT NULL,
    seed_quantity NUMERIC(14, 3) NOT NULL,
    observations VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT ck_plantings_harvest_format
        CHECK (harvest ~ '^[0-9]{4}/[0-9]{4}$'),
    CONSTRAINT ck_plantings_planted_area_positive
        CHECK (planted_area_hectares > 0),
    CONSTRAINT ck_plantings_seed_quantity_positive
        CHECK (seed_quantity > 0)
);

CREATE INDEX idx_plantings_harvest ON plantings (harvest);
CREATE INDEX idx_plantings_planting_date ON plantings (planting_date DESC);
