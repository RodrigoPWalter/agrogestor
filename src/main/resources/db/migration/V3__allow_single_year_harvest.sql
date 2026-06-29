ALTER TABLE plantings
    DROP CONSTRAINT ck_plantings_harvest_format;

ALTER TABLE plantings
    ADD CONSTRAINT ck_plantings_harvest_format
        CHECK (harvest ~ '^([0-9]{4}|[0-9]{4}/[0-9]{4})$');
