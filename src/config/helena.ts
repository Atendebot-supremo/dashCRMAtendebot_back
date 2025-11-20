import 'dotenv/config'

interface HelenaTokenConfig {
  clientId: string
  token: string
}

const parseHelenaTokens = (rawTokens: string | undefined): HelenaTokenConfig[] => {
  if (!rawTokens) {
    console.warn('[helena-config] Variável HELENA_TOKENS não definida.')
    return []
  }

  try {
    const parsed = JSON.parse(rawTokens) as unknown

    if (!Array.isArray(parsed)) {
      console.error('[helena-config] HELENA_TOKENS precisa ser um array JSON.')
      return []
    }

    return parsed
      .filter((entry): entry is HelenaTokenConfig => {
        if (
          typeof entry?.clientId !== 'string' ||
          typeof entry?.token !== 'string' ||
          !entry.clientId.trim() ||
          !entry.token.trim()
        ) {
          console.error(
            `[helena-config] Configuração inválida ignorada: ${JSON.stringify(entry)}`
          )
          return false
        }

        return true
      })
      .map((entry) => ({
        clientId: entry.clientId.trim(),
        token: entry.token.trim()
      }))
  } catch (error) {
    console.error('[helena-config] Erro ao parsear HELENA_TOKENS:', error)
    return []
  }
}

const helenaTokens = parseHelenaTokens(process.env.HELENA_TOKENS)

export const helenaConfig = {
  baseURL: process.env.HELENA_API_URL?.trim() || 'https://api.flw.chat'
}

export const getHelenaToken = (clientId: string): string => {
  if (!clientId?.trim()) {
    throw new Error('clientId inválido para recuperação do token Helena.')
  }

  const normalizedClientId = clientId.trim()
  const tokenEntry = helenaTokens.find(
    (entry) => entry.clientId.toLowerCase() === normalizedClientId.toLowerCase()
  )

  if (tokenEntry?.token) {
    return tokenEntry.token
  }

  console.error(`[helena-config] Token Helena não encontrado para cliente: ${normalizedClientId}`)
  throw new Error(`Token Helena não encontrado para cliente: ${normalizedClientId}`)
}

export type { HelenaTokenConfig }

