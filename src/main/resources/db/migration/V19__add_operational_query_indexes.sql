CREATE INDEX IF NOT EXISTS idx_plantings_status_start_date
    ON plantings (status, start_date DESC, crop);

CREATE INDEX IF NOT EXISTS idx_expenses_planting_date_created
    ON expenses (planting_id, expense_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_field_diary_planting_date_created
    ON field_diary_entries (planting_id, entry_date DESC, created_at DESC);
