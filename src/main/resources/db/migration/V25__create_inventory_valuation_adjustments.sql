CREATE TABLE inventory_valuation_adjustments (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
    adjustment_date DATE NOT NULL,
    previous_unit_cost NUMERIC(16, 6) NOT NULL,
    new_unit_cost NUMERIC(16, 6) NOT NULL,
    previous_inventory_value NUMERIC(16, 2) NOT NULL,
    new_inventory_value NUMERIC(16, 2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_inventory_valuation_new_cost_positive CHECK (new_unit_cost > 0)
);

CREATE INDEX idx_inventory_valuation_product_date
    ON inventory_valuation_adjustments(product_id, adjustment_date DESC, created_at DESC);
