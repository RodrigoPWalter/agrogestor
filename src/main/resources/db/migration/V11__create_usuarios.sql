CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_usuarios_role CHECK (role IN ('ADMIN', 'USER'))
);

CREATE UNIQUE INDEX uk_usuarios_email_lower ON usuarios (LOWER(email));
