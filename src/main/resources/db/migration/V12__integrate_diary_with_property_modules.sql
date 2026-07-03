ALTER TABLE field_diary_entries
    ALTER COLUMN planting_id DROP NOT NULL;

ALTER TABLE field_diary_entries
    DROP CONSTRAINT IF EXISTS ck_field_diary_activity_type;

ALTER TABLE field_diary_entries
    ADD CONSTRAINT ck_field_diary_activity_type CHECK (
        activity_type IN (
            'PLANTING', 'FERTILIZATION', 'APPLICATION',
            'INSPECTION', 'RAIN', 'PRODUCT_PURCHASE', 'PRODUCT_USE',
            'MAINTENANCE', 'OBSERVATION', 'HARVEST', 'OTHER'
        )
    );

ALTER TABLE field_diary_entries
    ADD COLUMN rainfall_mm NUMERIC(8, 2),
    ADD COLUMN supplier VARCHAR(160),
    ADD COLUMN amount NUMERIC(14, 2),
    ADD COLUMN machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    ADD COLUMN harvest_quantity NUMERIC(14, 3),
    ADD COLUMN harvest_unit VARCHAR(30),
    ADD COLUMN rainfall_id UUID REFERENCES rainfall_measurements(id) ON DELETE SET NULL,
    ADD COLUMN maintenance_id UUID REFERENCES maintenances(id) ON DELETE SET NULL,
    ADD COLUMN expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

ALTER TABLE rainfall_measurements
    DROP CONSTRAINT IF EXISTS rainfall_measurements_measurement_date_key;

ALTER TABLE rainfall_measurements
    ADD COLUMN planting_id UUID REFERENCES plantings(id) ON DELETE SET NULL;

ALTER TABLE expenses
    ALTER COLUMN planting_id DROP NOT NULL;

ALTER TABLE field_diary_products
    ADD COLUMN movement_type VARCHAR(10) NOT NULL DEFAULT 'EXIT',
    ADD CONSTRAINT ck_field_diary_product_movement_type
        CHECK (movement_type IN ('ENTRY', 'EXIT'));

CREATE INDEX idx_rainfall_planting ON rainfall_measurements(planting_id);
CREATE INDEX idx_diary_type ON field_diary_entries(activity_type);
