CREATE TABLE field_diary_products (
    id UUID PRIMARY KEY,
    entry_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC(14, 3) NOT NULL,
    CONSTRAINT fk_diary_product_entry
        FOREIGN KEY (entry_id) REFERENCES field_diary_entries (id) ON DELETE CASCADE,
    CONSTRAINT fk_diary_product_inventory
        FOREIGN KEY (product_id) REFERENCES inventory_products (id) ON DELETE RESTRICT,
    CONSTRAINT ck_diary_product_quantity_positive CHECK (quantity > 0),
    CONSTRAINT uk_diary_entry_product UNIQUE (entry_id, product_id)
);
