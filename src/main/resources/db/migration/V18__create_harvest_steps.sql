CREATE TABLE harvest_steps (
    id UUID PRIMARY KEY,
    planting_id UUID NOT NULL,
    harvest_date DATE NOT NULL,
    harvested_area_hectares NUMERIC(12, 2) NOT NULL,
    harvest_quantity NUMERIC(14, 3) NOT NULL,
    harvest_unit VARCHAR(30) NOT NULL,
    seed_variety VARCHAR(120) NOT NULL,
    start_time TIME,
    end_time TIME,
    observations VARCHAR(1000),
    diary_entry_id UUID UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_harvest_steps_planting
        FOREIGN KEY (planting_id) REFERENCES plantings (id) ON DELETE CASCADE,
    CONSTRAINT fk_harvest_steps_diary
        FOREIGN KEY (diary_entry_id) REFERENCES field_diary_entries (id) ON DELETE SET NULL,
    CONSTRAINT ck_harvest_steps_area_positive
        CHECK (harvested_area_hectares > 0),
    CONSTRAINT ck_harvest_steps_quantity_positive
        CHECK (harvest_quantity > 0),
    CONSTRAINT ck_harvest_steps_unit
        CHECK (harvest_unit IN ('BAGS_60_KG', 'KILOGRAMS', 'TONNES')),
    CONSTRAINT ck_harvest_steps_time_range
        CHECK (start_time IS NULL OR end_time IS NULL OR end_time >= start_time)
);

CREATE INDEX idx_harvest_steps_planting_date
    ON harvest_steps (planting_id, harvest_date, created_at);
