import axios, { AxiosInstance, AxiosError } from 'axios'
import type { Panel, Card, CardsResponse, PanelsResponse, CardFilters } from './types'

interface HelenaConfig {
  baseURL: string
  token: string
}

export class HelenaClient {
  private client: AxiosInstance

  constructor(config: HelenaConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      timeout: 30000
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          console.error(
            `Helena API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
          )
        } else if (error.request) {
          console.error('Helena API Error: No response received', error.request)
        } else {
          console.error('Helena API Error:', error.message)
        }
        throw error
      }
    )
  }

  async getPanels(): Promise<PanelsResponse> {
    const { data } = await this.client.get<PanelsResponse>('/crm/v1/panel')
    return data
  }

  async getPanelById(panelId: string): Promise<Panel> {
    const { data } = await this.client.get<Panel>(`/crm/v1/panel/${panelId}`)
    return data
  }

  async getCards(params: CardFilters): Promise<CardsResponse> {
    const { data } = await this.client.get<CardsResponse>('/crm/v1/panel/card', { params })
    return data
  }

  async getCardById(cardId: string): Promise<Card> {
    const { data } = await this.client.get<Card>(`/crm/v1/panel/card/${cardId}`)
    return data
  }

  async getContacts(params?: {
    startDate?: string
    endDate?: string
    channelId?: string
  }): Promise<{ items?: unknown[] }> {
    const { data } = await this.client.get('/core/public/v1/contact', { params })
    return data
  }
}

export default HelenaClient

