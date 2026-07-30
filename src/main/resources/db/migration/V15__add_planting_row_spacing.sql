ALTER TABLE plantings
    ADD COLUMN row_spacing_centimeters NUMERIC(6, 2);

ALTER TABLE plantings
    ADD CONSTRAINT ck_plantings_row_spacing_range
        CHECK (
            row_spacing_centimeters IS NULL
            OR (
                row_spacing_centimeters > 0
                AND row_spacing_centimeters <= 1000
            )
        );
