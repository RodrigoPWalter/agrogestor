CREATE TABLE properties (
    id UUID PRIMARY KEY,
    name VARCHAR(140) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Todos os dados que já existem pertencem à propriedade original. A ordem
-- abaixo permite migrar sem apagar ou recriar nenhum registro operacional.
INSERT INTO properties (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Propriedade principal');

ALTER TABLE usuarios ADD COLUMN property_id UUID;
ALTER TABLE usuarios ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE plantings ADD COLUMN property_id UUID;
ALTER TABLE expenses ADD COLUMN property_id UUID;
ALTER TABLE inventory_products ADD COLUMN property_id UUID;
ALTER TABLE machines ADD COLUMN property_id UUID;
ALTER TABLE field_diary_entries ADD COLUMN property_id UUID;
ALTER TABLE rainfall_measurements ADD COLUMN property_id UUID;

UPDATE usuarios SET property_id = '00000000-0000-0000-0000-000000000001';
UPDATE plantings SET property_id = '00000000-0000-0000-0000-000000000001';
UPDATE expenses SET property_id = '00000000-0000-0000-0000-000000000001';
UPDATE inventory_products SET property_id = '00000000-0000-0000-0000-000000000001';
UPDATE machines SET property_id = '00000000-0000-0000-0000-000000000001';
UPDATE field_diary_entries SET property_id = '00000000-0000-0000-0000-000000000001';
UPDATE rainfall_measurements SET property_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE usuarios ALTER COLUMN property_id SET NOT NULL;
ALTER TABLE plantings ALTER COLUMN property_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN property_id SET NOT NULL;
ALTER TABLE inventory_products ALTER COLUMN property_id SET NOT NULL;
ALTER TABLE machines ALTER COLUMN property_id SET NOT NULL;
ALTER TABLE field_diary_entries ALTER COLUMN property_id SET NOT NULL;
ALTER TABLE rainfall_measurements ALTER COLUMN property_id SET NOT NULL;

ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_property
    FOREIGN KEY (property_id) REFERENCES properties(id);
ALTER TABLE plantings ADD CONSTRAINT fk_plantings_property
    FOREIGN KEY (property_id) REFERENCES properties(id);
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_property
    FOREIGN KEY (property_id) REFERENCES properties(id);
ALTER TABLE inventory_products ADD CONSTRAINT fk_inventory_products_property
    FOREIGN KEY (property_id) REFERENCES properties(id);
ALTER TABLE machines ADD CONSTRAINT fk_machines_property
    FOREIGN KEY (property_id) REFERENCES properties(id);
ALTER TABLE field_diary_entries ADD CONSTRAINT fk_field_diary_entries_property
    FOREIGN KEY (property_id) REFERENCES properties(id);
ALTER TABLE rainfall_measurements ADD CONSTRAINT fk_rainfall_measurements_property
    FOREIGN KEY (property_id) REFERENCES properties(id);

CREATE INDEX idx_usuarios_property ON usuarios(property_id);
CREATE INDEX idx_plantings_property_status_date
    ON plantings(property_id, status, start_date DESC);
CREATE INDEX idx_expenses_property_date
    ON expenses(property_id, expense_date DESC);
CREATE INDEX idx_inventory_products_property_name
    ON inventory_products(property_id, name);
CREATE INDEX idx_machines_property_brand_model
    ON machines(property_id, brand, model);
CREATE INDEX idx_field_diary_property_date
    ON field_diary_entries(property_id, entry_date DESC);
CREATE INDEX idx_rainfall_property_date
    ON rainfall_measurements(property_id, measurement_date DESC);
