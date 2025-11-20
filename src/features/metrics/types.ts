export interface FunnelStage {
  stage: string
  stageId?: string
  leads: number
  value: number
  conversionRate: number
  averageTime: number
}

export interface FunnelMetrics {
  stages: FunnelStage[]
  totalLeads: number
  totalValue: number
  overallConversionRate: number
  forecast: number
}

export interface RevenueBySeller {
  sellerId: string
  sellerName: string
  revenue: number
  deals: number
  averageTicket: number
}

export interface RevenueByChannel {
  channelId: string
  channelName: string
  revenue: number
  deals: number
}

export interface RevenueMetrics {
  totalRevenue: number
  averageTicket: number
  closedDeals: number
  revenueBySeller: RevenueBySeller[]
  revenueByChannel: RevenueByChannel[]
}

export interface ConversionByStage {
  stage: string
  conversionRate: number
}

export interface ConversionMetrics {
  overallConversionRate: number
  averageSalesCycle: number
  averageResponseTime: number
  conversionByStage: ConversionByStage[]
}

export interface LossByReason {
  reason: string
  count: number
  value: number
  percentage: number
}

export interface LossByStage {
  stage: string
  count: number
  value: number
}

export interface LossMetrics {
  totalLost: number
  totalValueLost: number
  lossRate: number
  lossByReason: LossByReason[]
  lossByStage: LossByStage[]
}

export type TemporalPeriod = 'day' | 'week' | 'month' | 'year'

export interface TemporalDataPoint {
  period: string
  leads: number
  value: number
  closedDeals: number
  revenue: number
  conversionRate: number
}

export interface TemporalComparison {
  leadsGrowth: number
  valueGrowth: number
  revenueGrowth: number
}

export interface TemporalMetrics {
  period: TemporalPeriod
  data: TemporalDataPoint[]
  comparison: TemporalComparison
}

export interface SellerPerformance {
  sellerId: string
  sellerName: string
  totalLeads: number
  closedDeals: number
  revenue: number
  conversionRate: number
  averageTicket: number
  averageSalesCycle: number
  activities: number
  responseTime: number
}

export interface SellerRanking {
  rank: number
  sellerId: string
  metric: string
  value: number
}

export interface SellerPerformanceMetrics {
  sellers: SellerPerformance[]
  ranking: SellerRanking[]
}

export interface ProductMetrics {
  productId: string
  productName: string
  totalDeals: number
  closedDeals: number
  revenue: number
  averageTicket: number
  conversionRate: number
  averageClosingTime: number
}

export interface ProductsMetrics {
  products: ProductMetrics[]
}

export interface DashboardSummary {
  totalLeads: number
  totalValue: number
  closedDeals: number
  totalRevenue: number
  conversionRate: number
  averageTicket: number
}

export interface DashboardMetrics {
  summary: DashboardSummary
  funnel: FunnelMetrics
  revenue: RevenueMetrics
  conversion: ConversionMetrics
  loss: LossMetrics
  sellers: SellerPerformanceMetrics
}

export interface MetricsFilters {
  panelId: string
  startDate?: string
  endDate?: string
  userId?: string
  channelId?: string
  stepId?: string
  period?: TemporalPeriod
}

