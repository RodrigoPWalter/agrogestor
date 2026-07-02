CREATE TABLE field_diary_entries (
    id UUID PRIMARY KEY,
    planting_id UUID NOT NULL,
    entry_date DATE NOT NULL,
    activity_type VARCHAR(30) NOT NULL,
    activity VARCHAR(160) NOT NULL,
    weather_condition VARCHAR(120),
    applied_products VARCHAR(500),
    observations VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_field_diary_planting
        FOREIGN KEY (planting_id) REFERENCES plantings (id) ON DELETE RESTRICT,
    CONSTRAINT ck_field_diary_activity_type CHECK (activity_type IN (
        'PLANTING',
        'FERTILIZATION',
        'APPLICATION',
        'INSPECTION',
        'HARVEST',
        'OTHER'
    ))
);

CREATE INDEX idx_field_diary_planting ON field_diary_entries (planting_id);
CREATE INDEX idx_field_diary_entry_date ON field_diary_entries (entry_date DESC);
