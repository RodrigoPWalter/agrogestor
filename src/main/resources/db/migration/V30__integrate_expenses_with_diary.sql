ALTER TABLE field_diary_entries
    DROP CONSTRAINT IF EXISTS ck_field_diary_activity_type;

ALTER TABLE field_diary_entries
    ADD CONSTRAINT ck_field_diary_activity_type CHECK (
        activity_type IN (
            'PLANTING', 'FERTILIZATION', 'APPLICATION',
            'INSPECTION', 'RAIN', 'PRODUCT_PURCHASE', 'PRODUCT_USE',
            'EXPENSE', 'MAINTENANCE', 'OBSERVATION', 'HARVEST',
            'SALE', 'OTHER'
        )
    ),
    ADD COLUMN expense_category VARCHAR(30);

ALTER TABLE field_diary_entries
    ADD CONSTRAINT ck_diary_expense_category CHECK (
        expense_category IS NULL OR expense_category IN (
            'SEEDS', 'FERTILIZERS', 'PESTICIDES', 'FUEL',
            'MAINTENANCE', 'LABOR', 'OTHER'
        )
    );

ALTER TABLE expenses
    DROP CONSTRAINT IF EXISTS ck_expense_origin;

ALTER TABLE expenses
    ADD CONSTRAINT ck_expense_origin CHECK (
        origin IN ('DIRECT', 'DIARY', 'STOCK_ALLOCATION', 'MAINTENANCE')
    );

UPDATE expenses expense
SET origin = 'DIARY'
WHERE expense.origin = 'DIRECT'
  AND expense.id IN (
      SELECT entry.expense_id
      FROM field_diary_entries entry
      WHERE entry.activity_type = 'PRODUCT_PURCHASE'
        AND entry.expense_id IS NOT NULL
  );
