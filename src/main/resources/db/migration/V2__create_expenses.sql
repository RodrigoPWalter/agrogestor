CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    planting_id UUID NOT NULL,
    description VARCHAR(160) NOT NULL,
    category VARCHAR(30) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    expense_date DATE NOT NULL,
    observations VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_expenses_planting
        FOREIGN KEY (planting_id) REFERENCES plantings (id) ON DELETE RESTRICT,
    CONSTRAINT ck_expenses_category
        CHECK (category IN (
            'SEEDS',
            'FERTILIZERS',
            'PESTICIDES',
            'FUEL',
            'MAINTENANCE',
            'LABOR',
            'OTHER'
        )),
    CONSTRAINT ck_expenses_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_expenses_planting_id ON expenses (planting_id);
CREATE INDEX idx_expenses_expense_date ON expenses (expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses (category);
