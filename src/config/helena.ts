import 'dotenv/config'
import { getUserById } from './supabase'

// URL base da API Helena
export const helenaConfig = {
  baseURL: process.env.HELENA_API_URL?.trim() || 'https://api.helena.run'
}

// Buscar token Helena do Supabase pelo ID do usuário
export const getHelenaToken = async (userId: string): Promise<string> => {
  if (!userId?.trim()) {
    throw new Error('userId inválido para recuperação do token Helena.')
  }

  const user = await getUserById(userId)

  if (!user) {
    console.error(`[helena-config] Usuário não encontrado: ${userId}`)
    throw new Error(`Usuário não encontrado: ${userId}`)
  }

  if (!user.helena_token) {
    console.error(`[helena-config] Token Helena não configurado para usuário: ${userId}`)
    throw new Error(`Token Helena não configurado para usuário: ${userId}`)
  }

  return user.helena_token
}

// Verificar se a configuração Helena está OK
export const isHelenaConfigured = (): boolean => {
  return Boolean(helenaConfig.baseURL)
}

export type HelenaConfig = typeof helenaConfig
