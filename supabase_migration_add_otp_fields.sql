-- ============================================================
-- Migration: Adicionar campos OTP para Login sem Senha
-- Tabela: users_dashcrmatendebot
-- ============================================================

-- Adicionar campos de OTP (One-Time Password) para login sem senha
ALTER TABLE public.users_dashcrmatendebot
ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6) NULL,
ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS otp_locked_until TIMESTAMPTZ NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.users_dashcrmatendebot.otp_code IS 'Código OTP de 6 dígitos para login sem senha';
COMMENT ON COLUMN public.users_dashcrmatendebot.otp_expiry IS 'Data/hora de expiração do código OTP (5 minutos)';
COMMENT ON COLUMN public.users_dashcrmatendebot.otp_attempts IS 'Contador de tentativas de verificação do código OTP';
COMMENT ON COLUMN public.users_dashcrmatendebot.otp_locked_until IS 'Data/hora até quando o usuário está bloqueado por muitas tentativas';

-- Índices para performance de busca de OTP
CREATE INDEX IF NOT EXISTS idx_users_dashcrm_otp_code 
ON public.users_dashcrmatendebot(otp_code) 
WHERE otp_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_dashcrm_otp_expiry 
ON public.users_dashcrmatendebot(otp_expiry) 
WHERE otp_expiry IS NOT NULL;

-- ============================================================
-- Verificação: Estrutura final da tabela
-- ============================================================
-- Para verificar se a migração foi aplicada corretamente:
-- 
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users_dashcrmatendebot'
-- ORDER BY ordinal_position;
--
-- Campos esperados após migração:
-- - id (uuid)
-- - name (varchar)
-- - phone (varchar)
-- - helena_token (varchar)
-- - created_at (timestamptz)
-- - active (boolean)
-- - email (varchar)
-- - userName (varchar)
-- - otp_code (varchar) ← NOVO
-- - otp_expiry (timestamptz) ← NOVO
-- - otp_attempts (integer) ← NOVO
-- - otp_locked_until (timestamptz) ← NOVO
-- ============================================================

