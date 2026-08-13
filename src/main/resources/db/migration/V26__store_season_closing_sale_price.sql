ALTER TABLE plantings
    ADD COLUMN sale_price_per_60kg_bag NUMERIC(12, 2);

ALTER TABLE plantings
    ADD CONSTRAINT ck_plantings_sale_price_per_60kg_bag_positive
        CHECK (
            sale_price_per_60kg_bag IS NULL
            OR sale_price_per_60kg_bag > 0
        );
