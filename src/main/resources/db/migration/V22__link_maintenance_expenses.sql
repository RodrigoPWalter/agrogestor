ALTER TABLE expenses
    DROP CONSTRAINT ck_expense_origin;

ALTER TABLE expenses
    ADD CONSTRAINT ck_expense_origin
        CHECK (origin IN ('DIRECT', 'STOCK_ALLOCATION', 'MAINTENANCE'));

ALTER TABLE maintenances
    ADD COLUMN expense_id UUID;

-- Manutenções lançadas pelo Diário já possuem um gasto correspondente.
UPDATE maintenances maintenance
SET expense_id = entry.expense_id
FROM field_diary_entries entry
WHERE entry.maintenance_id = maintenance.id
  AND entry.expense_id IS NOT NULL;

UPDATE expenses expense
SET origin = 'MAINTENANCE',
    planting_id = NULL
WHERE expense.id IN (
    SELECT maintenance.expense_id
    FROM maintenances maintenance
    WHERE maintenance.expense_id IS NOT NULL
);

-- Registros antigos feitos diretamente em Máquinas passam a aparecer no financeiro.
UPDATE maintenances
SET expense_id = gen_random_uuid()
WHERE expense_id IS NULL
  AND cost > 0;

INSERT INTO expenses (
    id,
    property_id,
    planting_id,
    description,
    category,
    amount,
    expense_date,
    observations,
    origin,
    created_at,
    updated_at
)
SELECT
    maintenance.expense_id,
    machine.property_id,
    NULL,
    'Manutenção ' ||
        CASE maintenance.maintenance_type
            WHEN 'PREVENTIVE' THEN 'preventiva'
            ELSE 'corretiva'
        END ||
        ' — ' || machine.brand || ' ' || machine.model,
    'MAINTENANCE',
    maintenance.cost,
    maintenance.maintenance_date,
    LEFT(CONCAT_WS(E'\n',
        CASE
            WHEN maintenance.replaced_parts IS NOT NULL
                THEN 'Peças: ' || maintenance.replaced_parts
        END,
        maintenance.notes
    ), 1000),
    'MAINTENANCE',
    maintenance.created_at,
    maintenance.updated_at
FROM maintenances maintenance
JOIN machines machine ON machine.id = maintenance.machine_id
WHERE maintenance.expense_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM expenses expense
      WHERE expense.id = maintenance.expense_id
  );

ALTER TABLE maintenances
    ADD CONSTRAINT uq_maintenances_expense UNIQUE (expense_id),
    ADD CONSTRAINT fk_maintenances_expense
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL;
