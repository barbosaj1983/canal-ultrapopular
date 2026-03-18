"""
setup_neon.py — Executa o schema completo no Neon e valida a instalação
Uso: python setup_neon.py
Requer: pip install psycopg2-binary
"""

import psycopg2
import sys

CONN = "postgresql://neondb_owner:npg_9Oi3MGnWSwlv@ep-calm-breeze-anf5w16v-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

SCHEMA = """
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

INSERT INTO funcionarios (nome_completo, cpf, setor, email, password_hash, is_admin)
VALUES (
    'Administrador',
    '000.000.000-00',
    'Diretoria',
    'admin@ultrapopular.com',
    '$2b$12$GYZmOTRA3hCZwfVKAkclteZ5Tj6o4cWBZ3COLsAoVhaDHPi2Rhe.K',
    TRUE
)
ON CONFLICT (email) DO NOTHING;
"""

def main():
    print("=" * 55)
    print("  Canal Ultra Popular — Setup Neon")
    print("=" * 55)

    try:
        print("\n🔌 Conectando ao Neon...")
        conn = psycopg2.connect(CONN)
        conn.autocommit = True
        cur = conn.cursor()

        cur.execute("SELECT version()")
        ver = cur.fetchone()[0]
        print(f"✅ Conectado: {ver[:60]}")

        print("\n⚙️  Executando schema...")
        cur.execute(SCHEMA)
        print("✅ Schema executado")

        print("\n🔍 Validando tabelas criadas...")
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tabelas = [r[0] for r in cur.fetchall()]
        esperadas = ["funcionarios", "logs", "mensagens", "reset_pedidos"]
        for t in esperadas:
            status = "✅" if t in tabelas else "❌"
            print(f"  {status} {t}")

        print("\n👤 Verificando admin...")
        cur.execute("SELECT email, is_admin, ativo FROM funcionarios WHERE email = 'admin@ultrapopular.com'")
        admin = cur.fetchone()
        if admin:
            print(f"  ✅ Admin criado: {admin[0]} | is_admin={admin[1]} | ativo={admin[2]}")
        else:
            print("  ❌ Admin NÃO encontrado")

        print("\n📊 Índices criados...")
        cur.execute("""
            SELECT indexname FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
            ORDER BY indexname
        """)
        indices = [r[0] for r in cur.fetchall()]
        for i in indices:
            print(f"  ✅ {i}")

        cur.close()
        conn.close()

        print("\n" + "=" * 55)
        print("  ✅ SETUP CONCLUÍDO COM SUCESSO")
        print("=" * 55)
        print("\nPróximo passo: configurar DATABASE_URL no Render")
        print(f"\nCole esta string como DATABASE_URL:")
        print(f"  {CONN}")

    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
