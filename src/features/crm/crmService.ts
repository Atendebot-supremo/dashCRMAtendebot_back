import HelenaClient from './helenaClient'
import { getHelenaToken } from '../../config/helena'
import { helenaConfig } from '../../config/helena'
import type { Panel, Card, CardsResponse, PanelsResponse, CardFilters, User, Channel } from './types'

export class CrmService {
  private getClient(clientId: string): HelenaClient {
    const token = getHelenaToken(clientId)
    return new HelenaClient({
      baseURL: helenaConfig.baseURL,
      token
    })
  }

  async getPanels(clientId: string): Promise<PanelsResponse> {
    const client = this.getClient(clientId)
    const response = await client.getPanels()

    if (!response.items) {
      return { items: [], totalItems: 0 }
    }

    return {
      items: response.items,
      totalItems: response.totalItems ?? response.items.length
    }
  }

  async getPanelById(clientId: string, panelId: string): Promise<Panel> {
    const client = this.getClient(clientId)
    return await client.getPanelById(panelId)
  }

  async getCards(clientId: string, filters: CardFilters): Promise<CardsResponse> {
    const client = this.getClient(clientId)
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

  async getCardById(clientId: string, cardId: string): Promise<Card> {
    const client = this.getClient(clientId)
    return await client.getCardById(cardId)
  }

  async getUsers(clientId: string): Promise<{ items: User[]; totalItems: number }> {
    const client = this.getClient(clientId)
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

  async getChannels(clientId: string): Promise<{ items: Channel[]; totalItems: number }> {
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

