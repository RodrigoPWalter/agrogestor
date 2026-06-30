CREATE TABLE inventory_products (
    id UUID PRIMARY KEY,
    name VARCHAR(140) NOT NULL,
    product_type VARCHAR(20) NOT NULL,
    quantity NUMERIC(14, 3) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    minimum_stock NUMERIC(14, 3) NOT NULL DEFAULT 0,
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_inventory_product_type
        CHECK (product_type IN ('SEED', 'FERTILIZER', 'PESTICIDE')),
    CONSTRAINT ck_inventory_unit
        CHECK (unit IN ('LITER', 'KILOGRAM', 'UNIT')),
    CONSTRAINT ck_inventory_quantity_non_negative CHECK (quantity >= 0),
    CONSTRAINT ck_inventory_minimum_stock_non_negative CHECK (minimum_stock >= 0)
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    movement_type VARCHAR(10) NOT NULL,
    quantity NUMERIC(14, 3) NOT NULL,
    movement_date DATE NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_inventory_movement_product
        FOREIGN KEY (product_id) REFERENCES inventory_products (id) ON DELETE CASCADE,
    CONSTRAINT ck_inventory_movement_type CHECK (movement_type IN ('ENTRY', 'EXIT')),
    CONSTRAINT ck_inventory_movement_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_inventory_products_name ON inventory_products (name);
CREATE INDEX idx_inventory_movements_product ON inventory_movements (product_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements (movement_date DESC);

CREATE TABLE machines (
    id UUID PRIMARY KEY,
    model VARCHAR(120) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    manufacture_year INTEGER NOT NULL,
    usage_hours NUMERIC(12, 1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_machines_year CHECK (manufacture_year BETWEEN 1900 AND 2100),
    CONSTRAINT ck_machines_usage_hours_non_negative CHECK (usage_hours >= 0)
);

CREATE TABLE maintenances (
    id UUID PRIMARY KEY,
    machine_id UUID NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL,
    replaced_parts VARCHAR(1000),
    cost NUMERIC(14, 2) NOT NULL,
    next_review_hours NUMERIC(12, 1),
    notes VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_maintenances_machine
        FOREIGN KEY (machine_id) REFERENCES machines (id) ON DELETE CASCADE,
    CONSTRAINT ck_maintenance_type
        CHECK (maintenance_type IN ('PREVENTIVE', 'CORRECTIVE')),
    CONSTRAINT ck_maintenance_cost_non_negative CHECK (cost >= 0),
    CONSTRAINT ck_maintenance_next_review_hours_positive
        CHECK (next_review_hours IS NULL OR next_review_hours > 0)
);

CREATE INDEX idx_maintenances_machine ON maintenances (machine_id);
CREATE INDEX idx_maintenances_date ON maintenances (maintenance_date DESC);
