-- =============================================
-- SQL para criar a tabela users_dashcrmatendebot no Supabase
-- Execute este script no SQL Editor do Supabase Studio
-- =============================================

-- Criar tabela de usuários do dashboard CRM
CREATE TABLE IF NOT EXISTS users_dashcrmatendebot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  helena_token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- Criar índice para busca por telefone (performance)
CREATE INDEX IF NOT EXISTS idx_users_dashcrm_phone 
ON users_dashcrmatendebot(phone);

-- Criar índice para busca por status ativo
CREATE INDEX IF NOT EXISTS idx_users_dashcrm_active 
ON users_dashcrmatendebot(active);

-- Comentários na tabela
COMMENT ON TABLE users_dashcrmatendebot IS 'Usuários autorizados a acessar o dashboard CRM';
COMMENT ON COLUMN users_dashcrmatendebot.phone IS 'Telefone no formato internacional (ex: 5531999999999)';
COMMENT ON COLUMN users_dashcrmatendebot.helena_token IS 'Token permanente da API Helena para este cliente';

-- =============================================
-- Exemplo de inserção de um usuário de teste
-- Descomente e ajuste conforme necessário
-- =============================================

-- INSERT INTO users_dashcrmatendebot (name, phone, helena_token, active)
-- VALUES (
--   'Maxchip',
--   '5531999999999',
--   'pn_mh3AGdH9Exo8PsLsEQjRvg80IB66FEOieyPJlKaCxk',
--   true
-- );

-- =============================================
-- Políticas de segurança RLS (Row Level Security)
-- Ative conforme necessário
-- =============================================

-- Habilitar RLS na tabela (opcional, para maior segurança)
-- ALTER TABLE users_dashcrmatendebot ENABLE ROW LEVEL SECURITY;

-- Política para service_role ter acesso total
-- CREATE POLICY "Service role has full access" 
-- ON users_dashcrmatendebot
-- FOR ALL 
-- USING (true)
-- WITH CHECK (true);

