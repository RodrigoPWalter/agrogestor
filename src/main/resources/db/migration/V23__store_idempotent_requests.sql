CREATE TABLE idempotency_records (
    id UUID PRIMARY KEY,
    username VARCHAR(254) NOT NULL,
    request_key VARCHAR(100) NOT NULL,
    request_method VARCHAR(10) NOT NULL,
    request_path VARCHAR(500) NOT NULL,
    response_status INTEGER NOT NULL,
    response_content_type VARCHAR(120),
    response_body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_idempotency_user_key UNIQUE (username, request_key)
);

CREATE INDEX idx_idempotency_created_at
    ON idempotency_records(created_at);
