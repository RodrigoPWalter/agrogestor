ALTER TABLE plantings
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE plantings
    ADD CONSTRAINT ck_plantings_status CHECK (status IN ('ACTIVE', 'HARVESTED'));

CREATE INDEX idx_plantings_status ON plantings (status);
