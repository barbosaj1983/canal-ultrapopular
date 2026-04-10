-- Migration: adiciona coluna empresa em funcionarios e mensagens
-- Execute uma vez no banco de dados (Neon dashboard ou psql)

ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS empresa TEXT NOT NULL DEFAULT 'Ultrapopular';

ALTER TABLE mensagens
  ADD COLUMN IF NOT EXISTS empresa TEXT;

-- Indice para filtros por empresa no painel admin
CREATE INDEX IF NOT EXISTS idx_mensagens_empresa    ON mensagens(empresa);
CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa ON funcionarios(empresa);
