import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY?.trim()

if (!supabaseUrl) {
  console.error('[supabase] SUPABASE_URL não configurada.')
}

if (!supabaseServiceKey) {
  console.error('[supabase] SUPABASE_SERVICE_KEY não configurada.')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Tipo para a tabela users_dashcrmatendebot
export interface UserDashCRM {
  id: string
  name: string
  phone: string
  email?: string
  userName?: string
  helena_token: string
  created_at: string
  active: boolean
  // Campos OTP para login sem senha (opcionais)
  otp_code?: string | null
  otp_expiry?: string | null
  otp_attempts?: number
  otp_locked_until?: string | null
}

// Função para buscar usuário pelo telefone
export const getUserByPhone = async (phone: string): Promise<UserDashCRM | null> => {
  if (!phone?.trim()) {
    return null
  }

  // Normalizar telefone (remover espaços, traços, etc.)
  let normalizedPhone = phone.replace(/\D/g, '')

  // Tentar buscar primeiro com o telefone normalizado como está
  let { data, error } = await supabase
    .from('users_dashcrmatendebot')
    .select('*')
    .eq('phone', normalizedPhone)
    .eq('active', true)
    .single()

  // Se encontrou, retorna
  if (!error && data) {
    return data as UserDashCRM
  }

  // Se não encontrou e o telefone começa com 55, tenta sem o 55
  if (normalizedPhone.startsWith('55') && normalizedPhone.length > 2) {
    const phoneWithoutCountryCode = normalizedPhone.substring(2)
    const { data: dataWithout55, error: errorWithout55 } = await supabase
      .from('users_dashcrmatendebot')
      .select('*')
      .eq('phone', phoneWithoutCountryCode)
      .eq('active', true)
      .single()

    if (!errorWithout55 && dataWithout55) {
      return dataWithout55 as UserDashCRM
    }
  }
  // Se não encontrou e o telefone NÃO começa com 55, tenta com o 55
  else if (!normalizedPhone.startsWith('55')) {
    const phoneWithCountryCode = '55' + normalizedPhone
    const { data: dataWith55, error: errorWith55 } = await supabase
      .from('users_dashcrmatendebot')
      .select('*')
      .eq('phone', phoneWithCountryCode)
      .eq('active', true)
      .single()

    if (!errorWith55 && dataWith55) {
      return dataWith55 as UserDashCRM
    }
  }

  // Se não encontrou em nenhuma tentativa, retorna null
  if (error && error.code === 'PGRST116') {
    // Nenhum registro encontrado
    return null
  }

  if (error) {
    console.error('[supabase] Erro ao buscar usuário:', error)
  }

  return null
}

// Função para buscar usuário pelo ID
export const getUserById = async (id: string): Promise<UserDashCRM | null> => {
  if (!id?.trim()) {
    return null
  }

  const { data, error } = await supabase
    .from('users_dashcrmatendebot')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[supabase] Erro ao buscar usuário por ID:', error)
    return null
  }

  return data as UserDashCRM
}

// Função para buscar usuário pelo email
export const getUserByEmail = async (email: string): Promise<UserDashCRM | null> => {
  if (!email?.trim()) {
    return null
  }

  // Normalizar email (lowercase, trim)
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabase
    .from('users_dashcrmatendebot')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return null
    }
    console.error('[supabase] Erro ao buscar usuário por email:', error)
    return null
  }

  return data as UserDashCRM
}

// Função para obter o token Helena de um usuário
export const getHelenaTokenByUserId = async (userId: string): Promise<string | null> => {
  const user = await getUserById(userId)
  return user?.helena_token || null
}

// Atualizar dados OTP do usuário (salvar código gerado)
export const updateUserOTP = async (
  userId: string,
  otpData: {
    otp_code: string | null
    otp_expiry: string | null
    otp_attempts?: number
    otp_locked_until?: string | null
  }
): Promise<boolean> => {
  const { error } = await supabase
    .from('users_dashcrmatendebot')
    .update({
      ...otpData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('[supabase] Erro ao atualizar OTP:', error)
    return false
  }

  return true
}

// Buscar usuário com campos OTP (para verificação de código)
export const getUserWithOTPData = async (
  identifier: string,
  identifierType: 'email' | 'phone'
): Promise<UserDashCRM | null> => {
  if (identifierType === 'email') {
    // Busca por email (mais simples)
    const normalizedEmail = identifier.trim().toLowerCase()
    
    const { data, error } = await supabase
      .from('users_dashcrmatendebot')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[supabase] Usuário não encontrado por email:', normalizedEmail)
        return null
      }
      console.error('[supabase] Erro ao buscar usuário por email:', error)
      return null
    }

    console.log('[supabase] ✅ Usuário encontrado por email:', normalizedEmail)
    return data as UserDashCRM
  } else {
    // Busca por telefone (com lógica flexível de normalização)
    let normalizedPhone = identifier.replace(/\D/g, '')

    // Tentar buscar primeiro com o telefone normalizado como está
    let { data, error } = await supabase
      .from('users_dashcrmatendebot')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('active', true)
      .single()

    // Se encontrou, retorna
    if (!error && data) {
      console.log('[supabase] ✅ Usuário encontrado por telefone:', normalizedPhone)
      return data as UserDashCRM
    }

    // Se não encontrou e o telefone começa com 55, tenta sem o 55
    if (normalizedPhone.startsWith('55') && normalizedPhone.length > 2) {
      const phoneWithoutCountryCode = normalizedPhone.substring(2)
      const { data: dataWithout55, error: errorWithout55 } = await supabase
        .from('users_dashcrmatendebot')
        .select('*')
        .eq('phone', phoneWithoutCountryCode)
        .eq('active', true)
        .single()

      if (!errorWithout55 && dataWithout55) {
        console.log('[supabase] ✅ Usuário encontrado por telefone (sem 55):', phoneWithoutCountryCode)
        return dataWithout55 as UserDashCRM
      }
    }
    
    // Se não encontrou e o telefone NÃO começa com 55, tenta com o 55
    if (!normalizedPhone.startsWith('55')) {
      const phoneWithCountryCode = '55' + normalizedPhone
      const { data: dataWith55, error: errorWith55 } = await supabase
        .from('users_dashcrmatendebot')
        .select('*')
        .eq('phone', phoneWithCountryCode)
        .eq('active', true)
        .single()

      if (!errorWith55 && dataWith55) {
        console.log('[supabase] ✅ Usuário encontrado por telefone (com 55):', phoneWithCountryCode)
        return dataWith55 as UserDashCRM
      }
    }

    // Se não encontrou em nenhuma tentativa
    console.log('[supabase] ❌ Usuário não encontrado por telefone:', normalizedPhone)
    return null
  }
}

// Limpar dados OTP do usuário (após login bem-sucedido)
export const clearUserOTP = async (userId: string): Promise<boolean> => {
  return updateUserOTP(userId, {
    otp_code: null,
    otp_expiry: null,
    otp_attempts: 0,
    otp_locked_until: null
  })
}

// Incrementar tentativas de OTP
export const incrementOTPAttempts = async (
  userId: string,
  currentAttempts: number,
  lockUntil?: string
): Promise<boolean> => {
  const updateData: {
    otp_attempts: number
    otp_locked_until?: string
  } = {
    otp_attempts: currentAttempts + 1
  }

  if (lockUntil) {
    updateData.otp_locked_until = lockUntil
  }

  const { error } = await supabase
    .from('users_dashcrmatendebot')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    console.error('[supabase] Erro ao incrementar tentativas OTP:', error)
    return false
  }

  return true
}

export default supabase

