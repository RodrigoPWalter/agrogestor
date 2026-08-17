ALTER TABLE field_diary_entries
    DROP CONSTRAINT IF EXISTS ck_field_diary_activity_type;

ALTER TABLE field_diary_entries
    ADD CONSTRAINT ck_field_diary_activity_type CHECK (
        activity_type IN (
            'PLANTING', 'FERTILIZATION', 'APPLICATION',
            'INSPECTION', 'RAIN', 'PRODUCT_PURCHASE', 'PRODUCT_USE',
            'MAINTENANCE', 'OBSERVATION', 'HARVEST', 'SALE', 'OTHER'
        )
    ),
    ADD COLUMN production_sale_id UUID,
    ADD COLUMN sale_price_per_bag NUMERIC(12, 2);

CREATE UNIQUE INDEX idx_diary_production_sale
    ON field_diary_entries(production_sale_id)
    WHERE production_sale_id IS NOT NULL;
