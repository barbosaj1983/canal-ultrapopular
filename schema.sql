CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS funcionarios (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT        NOT NULL,
    cpf           TEXT        NOT NULL,
    setor         TEXT        NOT NULL,
    telefone      TEXT,
    email         TEXT        UNIQUE NOT NULL,
    password_hash TEXT        NOT NULL,
    is_admin      BOOLEAN     DEFAULT FALSE,
    ativo         BOOLEAN     DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensagens (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo       TEXT        NOT NULL CHECK (tipo IN ('sugestao','reclamacao','denuncia')),
    setor      TEXT        NOT NULL,
    mensagem   TEXT        NOT NULL,
    nome       TEXT        NOT NULL,
    user_email TEXT        NOT NULL,
    protocolo  TEXT        UNIQUE,
    hash       TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reset_pedidos (
    id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    funcionario_id UUID    REFERENCES funcionarios(id) ON DELETE CASCADE,
    user_email     TEXT    NOT NULL,
    atendido       BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID        REFERENCES funcionarios(id) ON DELETE SET NULL,
    acao      TEXT        NOT NULL,
    status    TEXT,
    ip        TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_email   ON mensagens(user_email);
CREATE INDEX IF NOT EXISTS idx_mensagens_created ON mensagens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user         ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp    ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reset_email       ON reset_pedidos(user_email);
CREATE INDEX IF NOT EXISTS idx_reset_atendido    ON reset_pedidos(atendido);

-- IMPORTANTE: Crie o admin via script seguro (setup_neon.py) ou pelo painel do banco.
-- Nunca insira hashes de senha diretamente neste arquivo versionado.
-- Exemplo de comando para criar admin via psql:
-- INSERT INTO funcionarios (nome_completo, cpf, setor, email, password_hash, is_admin)
-- VALUES ('Administrador','000.000.000-00','Diretoria','admin@ultrapopular.com',
--         crypt('SENHA_AQUI', gen_salt('bf')), TRUE)
-- ON CONFLICT (email) DO NOTHING;
