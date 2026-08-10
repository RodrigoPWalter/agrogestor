ALTER TABLE inventory_products
    ADD COLUMN inventory_value NUMERIC(16, 2) NOT NULL DEFAULT 0;

ALTER TABLE inventory_products
    ADD CONSTRAINT ck_inventory_value_non_negative CHECK (inventory_value >= 0);

ALTER TABLE inventory_movements
    ADD COLUMN unit_cost NUMERIC(16, 6) NOT NULL DEFAULT 0,
    ADD COLUMN total_cost NUMERIC(16, 2) NOT NULL DEFAULT 0;

ALTER TABLE inventory_movements
    ADD CONSTRAINT ck_inventory_movement_cost_non_negative
        CHECK (unit_cost >= 0 AND total_cost >= 0);

ALTER TABLE field_diary_products
    ADD COLUMN unit_cost NUMERIC(16, 6) NOT NULL DEFAULT 0,
    ADD COLUMN total_cost NUMERIC(16, 2) NOT NULL DEFAULT 0;

ALTER TABLE field_diary_products
    ADD CONSTRAINT ck_field_diary_product_cost_non_negative
        CHECK (unit_cost >= 0 AND total_cost >= 0);

-- Compras antigas com um único produto já possuem quantidade e valor no Diário.
-- Esse histórico permite iniciar a avaliação do saldo atual sem alterar quantidades.
WITH purchase_costs AS (
    SELECT
        fdp.product_id,
        SUM(fde.amount) AS total_paid,
        SUM(fdp.quantity) AS total_quantity
    FROM field_diary_products fdp
    JOIN field_diary_entries fde ON fde.id = fdp.entry_id
    WHERE fde.activity_type = 'PRODUCT_PURCHASE'
      AND fde.amount > 0
      AND fdp.movement_type = 'ENTRY'
      AND (SELECT COUNT(*) FROM field_diary_products items
           WHERE items.entry_id = fde.id) = 1
    GROUP BY fdp.product_id
), average_costs AS (
    SELECT
        product_id,
        total_paid / NULLIF(total_quantity, 0) AS unit_cost
    FROM purchase_costs
)
UPDATE inventory_products product
SET inventory_value = ROUND(product.quantity * costs.unit_cost, 2)
FROM average_costs costs
WHERE costs.product_id = product.id;

WITH single_product_purchases AS (
    SELECT
        fdp.id,
        fde.amount,
        fdp.quantity
    FROM field_diary_products fdp
    JOIN field_diary_entries fde ON fde.id = fdp.entry_id
    WHERE fde.activity_type = 'PRODUCT_PURCHASE'
      AND fde.amount > 0
      AND fdp.movement_type = 'ENTRY'
      AND (SELECT COUNT(*) FROM field_diary_products items
           WHERE items.entry_id = fde.id) = 1
)
UPDATE field_diary_products item
SET unit_cost = purchase.amount / NULLIF(purchase.quantity, 0),
    total_cost = purchase.amount
FROM single_product_purchases purchase
WHERE purchase.id = item.id;

WITH purchase_costs AS (
    SELECT
        fdp.product_id,
        SUM(fde.amount) / NULLIF(SUM(fdp.quantity), 0) AS unit_cost
    FROM field_diary_products fdp
    JOIN field_diary_entries fde ON fde.id = fdp.entry_id
    WHERE fde.activity_type = 'PRODUCT_PURCHASE'
      AND fde.amount > 0
      AND fdp.movement_type = 'ENTRY'
      AND (SELECT COUNT(*) FROM field_diary_products items
           WHERE items.entry_id = fde.id) = 1
    GROUP BY fdp.product_id
)
UPDATE field_diary_products item
SET unit_cost = costs.unit_cost,
    total_cost = ROUND(item.quantity * costs.unit_cost, 2)
FROM purchase_costs costs
WHERE costs.product_id = item.product_id
  AND item.movement_type = 'EXIT'
  AND item.total_cost = 0;

ALTER TABLE expenses
    ADD COLUMN origin VARCHAR(30) NOT NULL DEFAULT 'DIRECT';

ALTER TABLE expenses
    ADD CONSTRAINT ck_expense_origin
        CHECK (origin IN ('DIRECT', 'STOCK_ALLOCATION'));

-- O pagamento da compra pertence à propriedade. O custo passa ao plantio
-- somente quando o produto é efetivamente utilizado.
UPDATE expenses expense
SET planting_id = NULL
WHERE expense.id IN (
    SELECT entry.expense_id
    FROM field_diary_entries entry
    WHERE entry.activity_type = 'PRODUCT_PURCHASE'
      AND entry.expense_id IS NOT NULL
);

CREATE INDEX idx_expenses_property_origin_date
    ON expenses(property_id, origin, expense_date DESC);
