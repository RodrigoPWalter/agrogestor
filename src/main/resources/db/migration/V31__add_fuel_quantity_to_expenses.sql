ALTER TABLE expenses
    ADD COLUMN fuel_liters NUMERIC(14, 3);

ALTER TABLE expenses
    ADD CONSTRAINT ck_expense_fuel_liters CHECK (
        fuel_liters IS NULL OR (category = 'FUEL' AND fuel_liters > 0)
    );

ALTER TABLE field_diary_entries
    ADD COLUMN fuel_liters NUMERIC(14, 3);

ALTER TABLE field_diary_entries
    ADD CONSTRAINT ck_diary_fuel_liters CHECK (
        fuel_liters IS NULL OR (
            expense_category = 'FUEL' AND fuel_liters > 0
        )
    );
