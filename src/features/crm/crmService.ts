import HelenaClient from './helenaClient'
import { getHelenaToken, helenaConfig } from '../../config/helena'
import type { Panel, Card, CardsResponse, PanelsResponse, CardFilters, User, Agent } from './types'

export class CrmService {
  // Agora é assíncrono pois busca token do Supabase
  private async getClient(userId: string): Promise<HelenaClient> {
    const token = await getHelenaToken(userId)
    return new HelenaClient({
      baseURL: helenaConfig.baseURL,
      token
    })
  }

  async getPanels(userId: string): Promise<PanelsResponse> {
    const client = await this.getClient(userId)
    const response = await client.getPanels()

    if (!response.items) {
      return { items: [], totalItems: 0 }
    }

    return {
      items: response.items,
      totalItems: response.totalItems ?? response.items.length
    }
  }

  async getPanelById(userId: string, panelId: string): Promise<Panel> {
    const client = await this.getClient(userId)
    return await client.getPanelById(panelId)
  }

  async getCards(userId: string, filters: CardFilters): Promise<CardsResponse> {
    const client = await this.getClient(userId)
    const response = await client.getCards(filters)

    if (!response.items) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        pageNumber: filters.page || 1,
        pageSize: filters.pageSize || 100
      }
    }

    return {
      items: response.items,
      totalItems: response.totalItems ?? response.items.length,
      totalPages:
        response.totalPages ??
        Math.ceil((response.totalItems ?? response.items.length) / (filters.pageSize || 100)),
      pageNumber: response.pageNumber ?? filters.page ?? 1,
      pageSize: response.pageSize ?? filters.pageSize ?? 100
    }
  }

  async getCardById(userId: string, cardId: string): Promise<Card> {
    const client = await this.getClient(userId)
    return await client.getCardById(cardId)
  }

  async getAgentById(userId: string, agentId: string): Promise<Agent> {
    const client = await this.getClient(userId)
    return await client.getAgentById(agentId)
  }

  async getAgentsByPanel(userId: string, panelId: string): Promise<{ items: Agent[]; totalItems: number }> {
    const client = await this.getClient(userId)

    // Buscar todos os cards do painel para extrair os IDs dos responsáveis
    // A API Helena só aceita pageSize entre 1 e 100, então precisamos paginar
    const responsibleUserIds = new Set<string>()
    let page = 1
    const pageSize = 100
    let hasMorePages = true

    while (hasMorePages) {
      const cardsResponse = await client.getCards({ panelId, page, pageSize })

      if (cardsResponse.items && cardsResponse.items.length > 0) {
        cardsResponse.items.forEach((card) => {
          // A API Helena retorna responsibleUser: null, mas tem o responsibleUserId
          if (card.responsibleUserId) {
            responsibleUserIds.add(card.responsibleUserId)
          }
        })

        // Verificar se há mais páginas
        const totalPages = cardsResponse.totalPages ?? Math.ceil((cardsResponse.totalItems ?? 0) / pageSize)
        hasMorePages = page < totalPages
        page++
      } else {
        hasMorePages = false
      }
    }

    // Buscar detalhes de cada agente via /core/v1/agent/{userId}
    const agents: Agent[] = []
    for (const responsibleUserId of responsibleUserIds) {
      try {
        const agent = await client.getAgentById(responsibleUserId)
        agents.push(agent)
      } catch (error) {
        console.error(`[crm-service] Erro ao buscar agente ${responsibleUserId}:`, error)
        // Continua para o próximo agente mesmo se um falhar
      }
    }

    return {
      items: agents,
      totalItems: agents.length
    }
  }
}
