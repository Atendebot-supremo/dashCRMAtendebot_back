-- =============================================
-- MIGRAÇÃO: Adicionar coluna email na tabela users_dashcrmatendebot
-- Execute este script no SQL Editor do Supabase Studio
-- =============================================

-- Adicionar coluna email (opcional, pode ser NULL)
ALTER TABLE users_dashcrmatendebot 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Criar índice único para email (opcional, mas recomendado para performance)
-- Descomente se quiser garantir que emails sejam únicos
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_users_dashcrm_email 
-- ON users_dashcrmatendebot(email) 
-- WHERE email IS NOT NULL;

-- Criar índice para busca por email (performance)
CREATE INDEX IF NOT EXISTS idx_users_dashcrm_email 
ON users_dashcrmatendebot(email) 
WHERE email IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN users_dashcrmatendebot.email IS 'Email do usuário (opcional, usado para login alternativo)';

-- =============================================
-- Exemplo: Atualizar email de um usuário existente
-- =============================================

-- UPDATE users_dashcrmatendebot 
-- SET email = '[email protected]' 
-- WHERE phone = '5531999999999';












