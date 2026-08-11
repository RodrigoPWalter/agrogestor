CREATE INDEX IF NOT EXISTS idx_diary_property_rainfall
    ON field_diary_entries (property_id, rainfall_id)
    WHERE rainfall_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_diary_property_maintenance
    ON field_diary_entries (property_id, maintenance_id)
    WHERE maintenance_id IS NOT NULL;
