ALTER TABLE plantings
    RENAME COLUMN planted_area_hectares TO planned_area_hectares;

ALTER TABLE plantings
    RENAME COLUMN planting_date TO start_date;

ALTER TABLE plantings
    ADD COLUMN field_name VARCHAR(120);

ALTER TABLE plantings
    DROP CONSTRAINT IF EXISTS ck_plantings_planted_area_positive;

ALTER TABLE plantings
    ADD CONSTRAINT ck_plantings_planned_area_positive
        CHECK (planned_area_hectares > 0);

ALTER INDEX IF EXISTS idx_plantings_planting_date
    RENAME TO idx_plantings_start_date;

CREATE TABLE planting_steps (
    id UUID PRIMARY KEY,
    planting_id UUID NOT NULL,
    step_date DATE NOT NULL,
    planted_area_hectares NUMERIC(12, 2) NOT NULL,
    start_time TIME,
    end_time TIME,
    observations VARCHAR(1000),
    diary_entry_id UUID UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_planting_steps_planting
        FOREIGN KEY (planting_id) REFERENCES plantings (id) ON DELETE CASCADE,
    CONSTRAINT fk_planting_steps_diary
        FOREIGN KEY (diary_entry_id) REFERENCES field_diary_entries (id) ON DELETE SET NULL,
    CONSTRAINT ck_planting_steps_area_positive
        CHECK (planted_area_hectares > 0),
    CONSTRAINT ck_planting_steps_time_range
        CHECK (start_time IS NULL OR end_time IS NULL OR end_time >= start_time)
);

CREATE INDEX idx_planting_steps_planting_date
    ON planting_steps (planting_id, step_date, created_at);

-- Antes desta versão, a área cadastrada representava o que já havia sido plantado.
-- A etapa inicial mantém esse histórico sem alterar os números existentes.
INSERT INTO planting_steps (
    id,
    planting_id,
    step_date,
    planted_area_hectares,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    start_date,
    planned_area_hectares,
    created_at,
    updated_at
FROM plantings;
