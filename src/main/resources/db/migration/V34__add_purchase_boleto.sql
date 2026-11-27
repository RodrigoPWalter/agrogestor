ALTER TABLE field_diary_entries
    ADD COLUMN boleto_due_date DATE,
    ADD COLUMN boleto_name VARCHAR(160),
    ADD COLUMN boleto_paid BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE field_diary_entries ADD CONSTRAINT ck_diary_boleto_pair CHECK (
    (boleto_due_date IS NULL AND boleto_name IS NULL AND boleto_paid = FALSE)
    OR (activity_type = 'PRODUCT_PURCHASE' AND boleto_due_date IS NOT NULL
        AND boleto_name IS NOT NULL AND length(trim(boleto_name)) > 0)
);

CREATE INDEX idx_diary_property_boleto_due ON field_diary_entries (property_id, boleto_due_date)
    WHERE boleto_due_date IS NOT NULL;
