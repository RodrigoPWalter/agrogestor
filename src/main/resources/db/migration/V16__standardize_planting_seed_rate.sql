ALTER TABLE plantings
    ADD COLUMN seed_rate_unit VARCHAR(30);

ALTER TABLE plantings
    ADD CONSTRAINT ck_plantings_seed_rate_unit
        CHECK (
            seed_rate_unit IS NULL
            OR seed_rate_unit IN (
                'KILOGRAMS_PER_HECTARE',
                'SEEDS_PER_HECTARE'
            )
        );
