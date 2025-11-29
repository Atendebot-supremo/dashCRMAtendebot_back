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

// Tipo para a tabela users_dashCRMAtendebot
export interface UserDashCRM {
  id: string
  name: string
  phone: string
  helena_token: string
  created_at: string
  active: boolean
}

// Função para buscar usuário pelo telefone
export const getUserByPhone = async (phone: string): Promise<UserDashCRM | null> => {
  if (!phone?.trim()) {
    return null
  }

  // Normalizar telefone (remover espaços, traços, etc.)
  const normalizedPhone = phone.replace(/\D/g, '')

  const { data, error } = await supabase
    .from('users_dashcrmatendebot')
    .select('*')
    .eq('phone', normalizedPhone)
    .eq('active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return null
    }
    console.error('[supabase] Erro ao buscar usuário:', error)
    return null
  }

  return data as UserDashCRM
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

// Função para obter o token Helena de um usuário
export const getHelenaTokenByUserId = async (userId: string): Promise<string | null> => {
  const user = await getUserById(userId)
  return user?.helena_token || null
}

export default supabase

