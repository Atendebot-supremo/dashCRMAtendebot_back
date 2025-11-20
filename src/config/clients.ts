import 'dotenv/config'

export interface ClientCredentials {
  clientId: string
  name: string
  email: string
  passwordHash: string
}

const parseClientsConfig = (rawClients: string | undefined): ClientCredentials[] => {
  if (!rawClients) {
    console.warn('[clients-config] Variável CLIENTS_CONFIG não definida.')
    return []
  }

  try {
    const parsed = JSON.parse(rawClients) as unknown

    if (!Array.isArray(parsed)) {
      console.error('[clients-config] CLIENTS_CONFIG precisa ser um array JSON.')
      return []
    }

    return parsed
      .filter((entry): entry is ClientCredentials => {
        if (
          typeof entry?.clientId !== 'string' ||
          typeof entry?.name !== 'string' ||
          typeof entry?.email !== 'string' ||
          typeof entry?.passwordHash !== 'string'
        ) {
          console.error(
            `[clients-config] Entrada inválida ignorada: ${JSON.stringify(entry)}`
          )
          return false
        }

        return Boolean(
          entry.clientId.trim() && entry.name.trim() && entry.email.trim() && entry.passwordHash.trim()
        )
      })
      .map((entry) => ({
        clientId: entry.clientId.trim(),
        name: entry.name.trim(),
        email: entry.email.trim().toLowerCase(),
        passwordHash: entry.passwordHash.trim()
      }))
  } catch (error) {
    console.error('[clients-config] Erro ao parsear CLIENTS_CONFIG:', error)
    return []
  }
}

const clientsConfig = parseClientsConfig(process.env.CLIENTS_CONFIG)

export const getClientByEmail = (email: string): ClientCredentials | undefined => {
  if (!email?.trim()) {
    return undefined
  }

  const normalizedEmail = email.trim().toLowerCase()
  return clientsConfig.find((client) => client.email === normalizedEmail)
}

export const listClients = (): ClientCredentials[] => [...clientsConfig]

export const hasClientsConfigured = (): boolean => clientsConfig.length > 0

export const getClientById = (clientId: string): ClientCredentials | undefined => {
  if (!clientId?.trim()) {
    return undefined
  }

  const normalizedClientId = clientId.trim().toLowerCase()
  return clientsConfig.find((client) => client.clientId.toLowerCase() === normalizedClientId)
}

export { clientsConfig }

