CREATE TABLE production_sales (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL,
    planting_id UUID NOT NULL,
    sale_date DATE NOT NULL,
    quantity_bags NUMERIC(14, 3) NOT NULL,
    price_per_bag NUMERIC(12, 2) NOT NULL,
    buyer VARCHAR(120),
    observations VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_production_sales_property
        FOREIGN KEY (property_id) REFERENCES properties (id),
    CONSTRAINT fk_production_sales_planting
        FOREIGN KEY (planting_id) REFERENCES plantings (id) ON DELETE CASCADE,
    CONSTRAINT ck_production_sales_quantity_positive
        CHECK (quantity_bags > 0),
    CONSTRAINT ck_production_sales_price_positive
        CHECK (price_per_bag > 0)
);

CREATE INDEX idx_production_sales_property_date
    ON production_sales (property_id, sale_date DESC, created_at DESC);

CREATE INDEX idx_production_sales_planting_date
    ON production_sales (planting_id, sale_date DESC, created_at DESC);
