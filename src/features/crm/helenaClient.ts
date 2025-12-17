import axios, { AxiosInstance, AxiosError } from 'axios'
import type { Panel, Card, CardsResponse, PanelsResponse, CardFilters, Agent } from './types'

interface HelenaConfig {
  baseURL: string
  token: string
}

const PANEL_INCLUDE_DETAILS = ['Tags', 'Steps', 'StepsCardCount'] as const
const CARD_INCLUDE_DETAILS = [
  'PanelTitle',
  'StepTitle',
  'StepPhase',
  'ResponsibleUser',
  'Contacts',
  'CustomFields'
] as const

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

  private buildUrl(path: string, options?: { params?: Record<string, unknown> | object; includeDetails?: readonly string[] }) {
    if (!options?.params && !options?.includeDetails?.length) {
      return path
    }

    const searchParams = new URLSearchParams()

    if (options?.params) {
      Object.entries(options.params as Record<string, unknown>).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        searchParams.append(key, String(value))
      })
    }

    if (options?.includeDetails?.length) {
      options.includeDetails.forEach((detail) => {
        searchParams.append('IncludeDetails', detail)
      })
    }

    const query = searchParams.toString()
    if (!query) return path
    return `${path}?${query}`
  }

  async getPanels(): Promise<PanelsResponse> {
    const url = this.buildUrl('/crm/v1/panel', { includeDetails: PANEL_INCLUDE_DETAILS })
    const { data } = await this.client.get<PanelsResponse>(url)
    return data
  }

  async getPanelById(panelId: string): Promise<Panel> {
    const url = this.buildUrl(`/crm/v1/panel/${panelId}`, { includeDetails: PANEL_INCLUDE_DETAILS })
    const { data } = await this.client.get<Panel>(url)
    return data
  }

  async getCards(params: CardFilters): Promise<CardsResponse> {
    const url = this.buildUrl('/crm/v1/panel/card', { params, includeDetails: CARD_INCLUDE_DETAILS })
    const { data } = await this.client.get<CardsResponse>(url)
    return data
  }

  async getCardById(cardId: string): Promise<Card> {
    const url = this.buildUrl(`/crm/v1/panel/card/${cardId}`, { includeDetails: CARD_INCLUDE_DETAILS })
    const { data } = await this.client.get<Card>(url)
    return data
  }

  async getAgentById(agentId: string): Promise<Agent> {
    const { data } = await this.client.get<Agent>(`/core/v1/agent/${agentId}`)
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

