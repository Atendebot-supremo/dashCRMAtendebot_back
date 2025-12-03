import HelenaClient from './helenaClient'
import { getHelenaToken, helenaConfig } from '../../config/helena'
import type { Panel, Card, CardsResponse, PanelsResponse, CardFilters, User, Channel } from './types'

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

  async getUsers(userId: string): Promise<{ items: User[]; totalItems: number }> {
    const client = await this.getClient(userId)
    const cardsResponse = await client.getCards({ panelId: '' })

    const usersMap = new Map<string, User>()

    if (cardsResponse.items) {
      cardsResponse.items.forEach((card) => {
        if (card.responsibleUser && card.responsibleUserId) {
          if (!usersMap.has(card.responsibleUserId)) {
            usersMap.set(card.responsibleUserId, card.responsibleUser)
          }
        }
      })
    }

    return {
      items: Array.from(usersMap.values()),
      totalItems: usersMap.size
    }
  }

  async getChannels(_userId: string): Promise<{ items: Channel[]; totalItems: number }> {
    // Canais são estáticos por enquanto
    const channels: Channel[] = [
      { id: 'meta', name: 'Meta (Facebook/Instagram)', type: 'meta' },
      { id: 'google', name: 'Google Ads', type: 'google' },
      { id: 'whatsapp', name: 'WhatsApp', type: 'whatsapp' },
      { id: 'instagram', name: 'Instagram', type: 'instagram' },
      { id: 'telegram', name: 'Telegram', type: 'telegram' },
      { id: 'website', name: 'Website', type: 'website' },
      { id: 'email', name: 'E-mail', type: 'email' }
    ]

    return {
      items: channels,
      totalItems: channels.length
    }
  }
}
