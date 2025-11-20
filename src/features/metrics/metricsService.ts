import { CrmService } from '../crm/crmService'
import type { Card } from '../crm/types'
import {
  calculateConversionRate,
  calculateAverageTicket,
  calculateSalesCycle,
  calculateResponseTime,
  groupBy,
  sumBy,
  average
} from '../../utils/calculations'
import type {
  FunnelMetrics,
  RevenueMetrics,
  ConversionMetrics,
  LossMetrics,
  TemporalMetrics,
  SellerPerformanceMetrics,
  ProductsMetrics,
  DashboardMetrics,
  MetricsFilters,
  FunnelStage,
  RevenueBySeller,
  RevenueByChannel
} from './types'

export class MetricsService {
  private crmService = new CrmService()

  private async getCardsWithFilters(
    clientId: string,
    filters: MetricsFilters
  ): Promise<Card[]> {
    const cardFilters: {
      panelId: string
      startDate?: string
      endDate?: string
      userId?: string
      channelId?: string
      stepId?: string
    } = {
      panelId: filters.panelId
    }

    if (filters.startDate) cardFilters.startDate = filters.startDate
    if (filters.endDate) cardFilters.endDate = filters.endDate
    if (filters.userId) cardFilters.userId = filters.userId
    if (filters.channelId) cardFilters.channelId = filters.channelId
    if (filters.stepId) cardFilters.stepId = filters.stepId

    const response = await this.crmService.getCards(clientId, cardFilters)

    return response.items || []
  }

  private isCardClosed(card: Card): boolean {
    const phase = card.stepPhase?.toLowerCase()
    const title = card.stepTitle?.toLowerCase() || ''
    return phase === 'closed' || title.includes('fechado') || title.includes('ganho')
  }

  private isCardLost(card: Card): boolean {
    const phase = card.stepPhase?.toLowerCase()
    const title = card.stepTitle?.toLowerCase() || ''
    return phase === 'lost' || title.includes('perdido') || title.includes('perda')
  }

  async getFunnelMetrics(clientId: string, filters: MetricsFilters): Promise<FunnelMetrics> {
    const cards = await this.getCardsWithFilters(clientId, filters)

    if (!cards.length) {
      return {
        stages: [],
        totalLeads: 0,
        totalValue: 0,
        overallConversionRate: 0,
        forecast: 0
      }
    }

    const stageMap = groupBy(cards, (card) => card.stepId || card.stepTitle || 'Sem etapa')

    const stages: FunnelStage[] = Array.from(stageMap.entries())
      .map(([stageKey, stageCards], index) => {
        const firstCard = stageCards[0]
        const stageTitle = firstCard?.stepTitle || stageKey
        const stageId = firstCard?.stepId || stageKey

        const leads = stageCards.length
        const value = sumBy(stageCards, (card) => card.monetaryAmount || 0)

        const durations = stageCards
          .filter((card) => card.createdAt && card.updatedAt)
          .map((card) => {
            const start = new Date(card.createdAt!)
            const end = new Date(card.updatedAt!)
            const diff = end.getTime() - start.getTime()
            return diff / (1000 * 60 * 60 * 24)
          })
          .filter((days) => days > 0)

        const averageTime = durations.length > 0 ? average(durations) : 0

        let conversionRate = 100
        if (index > 0) {
          const previousStage = stages[index - 1]
          if (previousStage) {
            conversionRate = calculateConversionRate(leads, previousStage.leads)
          }
        }

        return {
          stage: stageTitle,
          stageId,
          leads,
          value,
          conversionRate,
          averageTime
        }
      })
      .sort((a, b) => (a.stageId || '').localeCompare(b.stageId || ''))

    const totalLeads = cards.length
    const totalValue = sumBy(cards, (card) => card.monetaryAmount || 0)
    const closedCards = cards.filter((card) => this.isCardClosed(card))
    const overallConversionRate =
      totalLeads > 0 ? calculateConversionRate(closedCards.length, totalLeads) : 0

    const averageValue = totalLeads > 0 ? totalValue / totalLeads : 0
    const forecast = averageValue * totalLeads * (overallConversionRate / 100) * 1.2

    return {
      stages,
      totalLeads,
      totalValue,
      overallConversionRate,
      forecast
    }
  }

  async getRevenueMetrics(clientId: string, filters: MetricsFilters): Promise<RevenueMetrics> {
    const cards = await this.getCardsWithFilters(clientId, filters)
    const closedCards = cards.filter((card) => this.isCardClosed(card))

    const totalRevenue = sumBy(closedCards, (card) => card.monetaryAmount || 0)
    const closedDeals = closedCards.length
    const averageTicket = calculateAverageTicket(totalRevenue, closedDeals)

    const sellerMap = groupBy(
      closedCards,
      (card) => card.responsibleUserId || 'unknown'
    )

    const revenueBySeller: RevenueBySeller[] = Array.from(sellerMap.entries())
      .map(([sellerId, sellerCards]) => {
        const firstCard = sellerCards[0]
        const sellerName = firstCard?.responsibleUser?.name || 'Sem vendedor'

        const revenue = sumBy(sellerCards, (card) => card.monetaryAmount || 0)
        const deals = sellerCards.length
        const ticket = calculateAverageTicket(revenue, deals)

        return {
          sellerId,
          sellerName,
          revenue,
          deals,
          averageTicket: ticket
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    const channelMap = groupBy(
      closedCards,
      (card) => (card.metadata?.channelId as string) || 'unknown'
    )

    const revenueByChannel: RevenueByChannel[] = Array.from(channelMap.entries())
      .map(([channelId, channelCards]) => {
        const channelNames: Record<string, string> = {
          whatsapp: 'WhatsApp',
          meta: 'Meta',
          google: 'Google Ads',
          instagram: 'Instagram',
          telegram: 'Telegram',
          website: 'Website',
          email: 'E-mail'
        }

        const revenue = sumBy(channelCards, (card) => card.monetaryAmount || 0)
        const deals = channelCards.length

        return {
          channelId,
          channelName: channelNames[channelId] || channelId,
          revenue,
          deals
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    return {
      totalRevenue,
      averageTicket,
      closedDeals,
      revenueBySeller,
      revenueByChannel
    }
  }

  async getConversionMetrics(clientId: string, filters: MetricsFilters): Promise<ConversionMetrics> {
    const cards = await this.getCardsWithFilters(clientId, filters)
    const closedCards = cards.filter((card) => this.isCardClosed(card))

    const totalCards = cards.length
    const overallConversionRate =
      totalCards > 0 ? calculateConversionRate(closedCards.length, totalCards) : 0

    const averageSalesCycle = calculateSalesCycle(closedCards)

    const averageResponseTime = calculateResponseTime(
      closedCards.map((card) => ({
        startedAt: card.createdAt,
        respondedAt: card.updatedAt
      }))
    )

    const stageMap = groupBy(cards, (card) => card.stepId || card.stepTitle || 'Sem etapa')

    const conversionByStage = Array.from(stageMap.entries()).map(([stageKey, stageCards]) => {
      const firstCard = stageCards[0]
      const stageTitle = firstCard?.stepTitle || stageKey

      const closedInStage = stageCards.filter((card) => this.isCardClosed(card))
      const conversionRate =
        stageCards.length > 0
          ? calculateConversionRate(closedInStage.length, stageCards.length)
          : 0

      return {
        stage: stageTitle,
        conversionRate
      }
    })

    return {
      overallConversionRate,
      averageSalesCycle,
      averageResponseTime,
      conversionByStage
    }
  }

  async getLossAnalysis(clientId: string, filters: MetricsFilters): Promise<LossMetrics> {
    const cards = await this.getCardsWithFilters(clientId, filters)
    const lostCards = cards.filter((card) => this.isCardLost(card))

    const totalLost = lostCards.length
    const totalValueLost = sumBy(lostCards, (card) => card.monetaryAmount || 0)
    const totalCards = cards.length
    const lossRate = totalCards > 0 ? calculateConversionRate(totalLost, totalCards) : 0

    const reasonMap = groupBy(
      lostCards,
      (card) =>
        (card.metadata?.lostReason as string) ||
        (card.customFields?.lostReason as string) ||
        'Não informado'
    )

    const lossByReason = Array.from(reasonMap.entries())
      .map(([reason, reasonCards]) => {
        const count = reasonCards.length
        const value = sumBy(reasonCards, (card) => card.monetaryAmount || 0)
        const percentage = totalLost > 0 ? calculateConversionRate(count, totalLost) : 0

        return {
          reason,
          count,
          value,
          percentage
        }
      })
      .sort((a, b) => b.count - a.count)

    const stageMap = groupBy(lostCards, (card) => card.stepId || card.stepTitle || 'Sem etapa')

    const lossByStage = Array.from(stageMap.entries())
      .map(([stageKey, stageCards]) => {
        const firstCard = stageCards[0]
        const stageTitle = firstCard?.stepTitle || stageKey

        const count = stageCards.length
        const value = sumBy(stageCards, (card) => card.monetaryAmount || 0)

        return {
          stage: stageTitle,
          count,
          value
        }
      })
      .sort((a, b) => b.count - a.count)

    return {
      totalLost,
      totalValueLost,
      lossRate,
      lossByReason,
      lossByStage
    }
  }

  async getTemporalComparison(
    clientId: string,
    filters: MetricsFilters
  ): Promise<TemporalMetrics> {
    const cards = await this.getCardsWithFilters(clientId, filters)
    const period = filters.period || 'month'

    if (!cards.length) {
      return {
        period,
        data: [],
        comparison: {
          leadsGrowth: 0,
          valueGrowth: 0,
          revenueGrowth: 0
        }
      }
    }

    const formatPeriod = (date: Date, period: MetricsFilters['period']): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const week = Math.ceil(date.getDate() / 7)

      switch (period) {
        case 'day':
          return `${year}-${month}-${day}`
        case 'week':
          return `${year}-W${week.toString().padStart(2, '0')}`
        case 'month':
          return `${year}-${month}`
        case 'year':
          return String(year)
        default:
          return `${year}-${month}`
      }
    }

    const periodMap = groupBy(cards, (card) => {
      if (!card.createdAt) return 'unknown'
      const date = new Date(card.createdAt)
      return formatPeriod(date, period)
    })

    const dataPoints = Array.from(periodMap.entries())
      .map(([periodKey, periodCards]) => {
        const closedCards = periodCards.filter((card) => this.isCardClosed(card))
        const leads = periodCards.length
        const value = sumBy(periodCards, (card) => card.monetaryAmount || 0)
        const closedDeals = closedCards.length
        const revenue = sumBy(closedCards, (card) => card.monetaryAmount || 0)
        const conversionRate =
          leads > 0 ? calculateConversionRate(closedDeals, leads) : 0

        return {
          period: periodKey,
          leads,
          value,
          closedDeals,
          revenue,
          conversionRate
        }
      })
      .sort((a, b) => a.period.localeCompare(b.period))

    let comparison = {
      leadsGrowth: 0,
      valueGrowth: 0,
      revenueGrowth: 0
    }

    if (dataPoints.length >= 2) {
      const previous = dataPoints[dataPoints.length - 2]
      const current = dataPoints[dataPoints.length - 1]

      if (previous && current) {
        comparison = {
          leadsGrowth:
            previous.leads > 0
              ? calculateConversionRate(current.leads - previous.leads, previous.leads)
              : 0,
          valueGrowth:
            previous.value > 0
              ? calculateConversionRate(current.value - previous.value, previous.value)
              : 0,
          revenueGrowth:
            previous.revenue > 0
              ? calculateConversionRate(current.revenue - previous.revenue, previous.revenue)
              : 0
        }
      }
    }

    return {
      period,
      data: dataPoints,
      comparison
    }
  }

  async getSellerPerformance(
    clientId: string,
    filters: MetricsFilters
  ): Promise<SellerPerformanceMetrics> {
    const cards = await this.getCardsWithFilters(clientId, filters)
    const sellerMap = groupBy(cards, (card) => card.responsibleUserId || 'unknown')

    const sellers = Array.from(sellerMap.entries())
      .map(([sellerId, sellerCards]) => {
        const firstCard = sellerCards[0]
        const sellerName = firstCard?.responsibleUser?.name || 'Sem vendedor'

        const totalLeads = sellerCards.length
        const closedCards = sellerCards.filter((card) => this.isCardClosed(card))
        const closedDeals = closedCards.length
        const revenue = sumBy(closedCards, (card) => card.monetaryAmount || 0)
        const conversionRate =
          totalLeads > 0 ? calculateConversionRate(closedDeals, totalLeads) : 0
        const ticket = calculateAverageTicket(revenue, closedDeals)
        const salesCycle = calculateSalesCycle(closedCards)

        return {
          sellerId,
          sellerName,
          totalLeads,
          closedDeals,
          revenue,
          conversionRate,
          averageTicket: ticket,
          averageSalesCycle: salesCycle,
          activities: totalLeads,
          responseTime: calculateResponseTime(
            sellerCards.map((card) => ({
              startedAt: card.createdAt,
              respondedAt: card.updatedAt
            }))
          )
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    const ranking = sellers
      .map((seller, index) => ({
        rank: index + 1,
        sellerId: seller.sellerId,
        metric: 'revenue',
        value: seller.revenue
      }))
      .slice(0, 10)

    return {
      sellers,
      ranking
    }
  }

  async getProductsAnalysis(
    clientId: string,
    filters: MetricsFilters
  ): Promise<ProductsMetrics> {
    const cards = await this.getCardsWithFilters(clientId, filters)

    const productMap = groupBy(cards, (card) => {
      const productId =
        (card.customFields?.productId as string) ||
        (card.customFields?.product as string) ||
        card.title ||
        'unknown'

      return productId
    })

    const products = Array.from(productMap.entries())
      .map(([productId, productCards]) => {
        const firstCard = productCards[0]
        const productName =
          (firstCard?.customFields?.productName as string) ||
          (firstCard?.customFields?.product as string) ||
          firstCard?.title ||
          productId

        const totalDeals = productCards.length
        const closedCards = productCards.filter((card) => this.isCardClosed(card))
        const closedDeals = closedCards.length
        const revenue = sumBy(closedCards, (card) => card.monetaryAmount || 0)
        const ticket = calculateAverageTicket(revenue, closedDeals)
        const conversionRate =
          totalDeals > 0 ? calculateConversionRate(closedDeals, totalDeals) : 0
        const closingTime = calculateSalesCycle(closedCards)

        return {
          productId,
          productName,
          totalDeals,
          closedDeals,
          revenue,
          averageTicket: ticket,
          conversionRate,
          averageClosingTime: closingTime
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    return { products }
  }

  async getDashboard(clientId: string, filters: MetricsFilters): Promise<DashboardMetrics> {
    const [
      funnelMetrics,
      revenueMetrics,
      conversionMetrics,
      lossMetrics,
      sellerMetrics
    ] = await Promise.all([
      this.getFunnelMetrics(clientId, filters),
      this.getRevenueMetrics(clientId, filters),
      this.getConversionMetrics(clientId, filters),
      this.getLossAnalysis(clientId, filters),
      this.getSellerPerformance(clientId, filters)
    ])

    const summary = {
      totalLeads: funnelMetrics.totalLeads,
      totalValue: funnelMetrics.totalValue,
      closedDeals: revenueMetrics.closedDeals,
      totalRevenue: revenueMetrics.totalRevenue,
      conversionRate: conversionMetrics.overallConversionRate,
      averageTicket: revenueMetrics.averageTicket
    }

    return {
      summary,
      funnel: funnelMetrics,
      revenue: revenueMetrics,
      conversion: conversionMetrics,
      loss: lossMetrics,
      sellers: sellerMetrics
    }
  }
}

