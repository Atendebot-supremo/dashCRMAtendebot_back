export interface Panel {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
  // IncludeDetails=Tags
  tags?: unknown[]
  // IncludeDetails=Steps
  steps?: PanelStep[]
}

export interface PanelStep {
  id: string
  title: string
  phase?: string
  position?: number
  // IncludeDetails=StepsCardCount (Helena pode devolver como número ou objeto)
  cardCount?: number | Record<string, unknown>
}

export interface Card {
  id: string
  title: string
  key?: string
  number?: number
  panelId: string
  panelTitle?: string
  stepId?: string
  stepTitle?: string
  stepPhase?: string
  position?: number
  description?: string
  monetaryAmount?: number
  isOverdue?: boolean
  dueDate?: string | null
  archived?: boolean
  createdAt?: string
  updatedAt?: string
  responsibleUserId?: string | null
  responsibleUser?: User | null
  contactIds?: string[]
  contacts?: Contact[]
  companyId?: string
  tagIds?: string[]
  sessionId?: string | null
  customFields?: Record<string, unknown>
  metadata?: Record<string, unknown>
  history?: CardHistory[]
}

export interface CardHistory {
  timestamp: string
  action: string
  user?: string
  details?: string
}

export interface Contact {
  id: string
  name?: string
  phone?: string
  email?: string
  companyId?: string
  metadata?: Record<string, unknown>
}

export interface User {
  id: string
  name: string
  email: string
  role?: string
}

export interface AgentDepartment {
  agentId: string
  departmentId: string
  isAgent: boolean
  isSupervisor: boolean
}

export interface Agent {
  id: string
  createdAt?: string
  updatedAt?: string
  companyId?: string
  userId: string
  name: string
  shortName?: string
  email?: string
  phoneNumber?: string
  phoneNumberFormatted?: string
  profile?: string
  isOwner?: boolean
  departments?: AgentDepartment[]
}

export interface CardFilters {
  panelId: string
  startDate?: string
  endDate?: string
  userId?: string
  channelId?: string
  stepId?: string
  page?: number
  pageSize?: number
}

export interface CardsResponse {
  items: Card[]
  totalItems?: number
  totalPages?: number
  pageNumber?: number
  pageSize?: number
}

export interface PanelsResponse {
  items?: Panel[]
  totalItems?: number
}

