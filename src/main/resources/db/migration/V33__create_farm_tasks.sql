CREATE TABLE farm_tasks (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL,
    planting_id UUID,
    machine_id UUID,
    title VARCHAR(160) NOT NULL,
    category VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    due_date DATE NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    notes VARCHAR(1000),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_farm_tasks_property
        FOREIGN KEY (property_id) REFERENCES properties (id),
    CONSTRAINT fk_farm_tasks_planting
        FOREIGN KEY (planting_id) REFERENCES plantings (id) ON DELETE SET NULL,
    CONSTRAINT fk_farm_tasks_machine
        FOREIGN KEY (machine_id) REFERENCES machines (id) ON DELETE SET NULL,
    CONSTRAINT ck_farm_tasks_category
        CHECK (category IN ('GENERAL', 'PLANTING', 'MACHINE', 'INVENTORY', 'PURCHASE', 'OTHER')),
    CONSTRAINT ck_farm_tasks_status
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT ck_farm_tasks_duration_positive
        CHECK (estimated_duration_minutes > 0)
);

CREATE INDEX idx_farm_tasks_property_status_due
    ON farm_tasks (property_id, status, due_date, created_at);

CREATE INDEX idx_farm_tasks_planting
    ON farm_tasks (planting_id) WHERE planting_id IS NOT NULL;

CREATE INDEX idx_farm_tasks_machine
    ON farm_tasks (machine_id) WHERE machine_id IS NOT NULL;
