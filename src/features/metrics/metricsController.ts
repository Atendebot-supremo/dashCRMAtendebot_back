import { Response } from 'express'
import { validationResult } from 'express-validator'
import { MetricsService } from './metricsService'
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCode
} from '../../types'
import type { AuthRequest } from '../../middleware/auth.middleware'
import type { MetricsFilters } from './types'

export default class MetricsController {
  private service = new MetricsService()

  private extractFilters(req: AuthRequest): MetricsFilters {
    const { panelId, startDate, endDate, userId, channelId, stepId, period } =
      req.query

    const filters: {
      panelId: string
      startDate?: string
      endDate?: string
      userId?: string
      channelId?: string
      stepId?: string
      period?: MetricsFilters['period']
    } = {
      panelId: panelId as string
    }

    if (startDate) filters.startDate = startDate as string
    if (endDate) filters.endDate = endDate as string
    if (userId) filters.userId = userId as string
    if (channelId) filters.channelId = channelId as string
    if (stepId) filters.stepId = stepId as string
    if (period) {
      const validPeriods: Array<MetricsFilters['period']> = ['day', 'week', 'month', 'year']
      const periodValue = period as string
      if (validPeriods.includes(periodValue as MetricsFilters['period'])) {
        filters.period = periodValue as MetricsFilters['period']
      }
    }

    return filters as MetricsFilters
  }

  /**
   * @swagger
   * /api/metrics/funnel:
   *   get:
   *     summary: Métricas do funil de vendas
   *     tags: [Metrics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: panelId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   */
  getFunnelMetrics = async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              'Dados de entrada inválidos',
              ErrorCode.INVALID_INPUT,
              errors.array()
            )
          )
      }

      const clientId = req.context?.user?.id

      if (!clientId) {
        return res
          .status(401)
          .json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const filters = this.extractFilters(req)

      if (!filters.panelId) {
        return res
          .status(400)
          .json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const metrics = await this.service.getFunnelMetrics(clientId, filters)

      return res
        .status(200)
        .json(createSuccessResponse(metrics, 'Métricas do funil calculadas com sucesso'))
    } catch (error) {
      console.error('[metrics-controller] Erro ao calcular métricas do funil:', error)
      return res
        .status(500)
        .json(
          createErrorResponse(
            'Erro ao calcular métricas do funil',
            ErrorCode.INTERNAL_SERVER_ERROR
          )
        )
    }
  }

  /**
   * @swagger
   * /api/metrics/revenue:
   *   get:
   *     summary: Métricas de receita
   *     tags: [Metrics]
   *     security:
   *       - bearerAuth: []
   */
  getRevenueMetrics = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res
          .status(401)
          .json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const filters = this.extractFilters(req)

      if (!filters.panelId) {
        return res
          .status(400)
          .json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const metrics = await this.service.getRevenueMetrics(clientId, filters)

      return res
        .status(200)
        .json(createSuccessResponse(metrics, 'Métricas de receita calculadas com sucesso'))
    } catch (error) {
      console.error('[metrics-controller] Erro ao calcular métricas de receita:', error)
      return res
        .status(500)
        .json(
          createErrorResponse(
            'Erro ao calcular métricas de receita',
            ErrorCode.INTERNAL_SERVER_ERROR
          )
        )
    }
  }

  /**
   * @swagger
   * /api/metrics/conversion:
   *   get:
   *     summary: Métricas de conversão
   *     tags: [Metrics]
   *     security:
   *       - bearerAuth: []
   */
  getConversionMetrics = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res
          .status(401)
          .json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const filters = this.extractFilters(req)

      if (!filters.panelId) {
        return res
          .status(400)
          .json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const metrics = await this.service.getConversionMetrics(clientId, filters)

      return res
        .status(200)
        .json(
          createSuccessResponse(metrics, 'Métricas de conversão calculadas com sucesso')
        )
    } catch (error) {
      console.error('[metrics-controller] Erro ao calcular métricas de conversão:', error)
      return res
        .status(500)
        .json(
          createErrorResponse(
            'Erro ao calcular métricas de conversão',
            ErrorCode.INTERNAL_SERVER_ERROR
          )
        )
    }
  }

  /**
   * @swagger
   * /api/metrics/loss:
   *   get:
   *     summary: Análise de perdas
   *     tags: [Metrics]
   *     security:
   *       - bearerAuth: []
   */
  getLossAnalysis = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res
          .status(401)
          .json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const filters = this.extractFilters(req)

      if (!filters.panelId) {
        return res
          .status(400)
          .json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const metrics = await this.service.getLossAnalysis(clientId, filters)

      return res
        .status(200)
        .json(createSuccessResponse(metrics, 'Análise de perdas calculada com sucesso'))
    } catch (error) {
      console.error('[metrics-controller] Erro ao calcular análise de perdas:', error)
      return res
        .status(500)
        .json(
          createErrorResponse(
            'Erro ao calcular análise de perdas',
            ErrorCode.INTERNAL_SERVER_ERROR
          )
        )
    }
  }

  /**
   * @swagger
   * /api/metrics/temporal:
   *   get:
   *     summary: Comparações temporais
   *     tags: [Metrics]
   *     security:
   *       - bearerAuth: []
   */
  getTemporalComparison = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res
          .status(401)
          .json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const filters = this.extractFilters(req)

      if (!filters.panelId) {
        return res
          .status(400)
          .json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const metrics = await this.service.getTemporalComparison(clientId, filters)

      return res
        .status(200)
        .json(
          createSuccessResponse(metrics, 'Comparações temporais calculadas com sucesso')
        )
    } catch (error) {
      console.error('[metrics-controller] Erro ao calcular comparações temporais:', error)
      return res
        .status(500)
        .json(
          createErrorResponse(
            'Erro ao calcular comparações temporais',
            ErrorCode.INTERNAL_SERVER_ERROR
          )
        )
    }
  }

  /**
   * @swagger
   * /api/metrics/seller-performance:
   *   get:
   *     summary: Performance por vendedor
   *     tags: [Metrics]
   *     security:
   *       - bearerAuth: []
   */
  getSellerPerformance = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res
          .status(401)
          .json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const filters = this.extractFilters(req)

      if (!filters.panelId) {
        return res
          .status(400)
          .json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const metrics = await this.service.getSellerPerformance(clientId, filters)

      return res
        .status(200)
        .json(
          createSuccessResponse(metrics, 'Performance por vendedor calculada com sucesso')
        )
    } catch (error) {
      console.error('[metrics-controller] Erro ao calcular performance por vendedor:', error)
      return res
        .status(500)
        .json(
          createErrorResponse(
            'Erro ao calcular performance por vendedor',
            ErrorCode.INTERNAL_SERVER_ERROR
          )
        )
    }
  }

  /**
   * @swagger
   * /api/metrics/products:
   *   get:
   *     summary: Análise de produtos
   *     tags: [Metrics]
   *     security:
   *       - bearerAuth: []
   */
  getProductsAnalysis = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res
          .status(401)
          .json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const filters = this.extractFilters(req)

      if (!filters.panelId) {
        return res
          .status(400)
          .json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const metrics = await this.service.getProductsAnalysis(clientId, filters)

      return res
        .status(200)
        .json(createSuccessResponse(metrics, 'Análise de produtos calculada com sucesso'))
    } catch (error) {
      console.error('[metrics-controller] Erro ao calcular análise de produtos:', error)
      return res
        .status(500)
        .json(
          createErrorResponse(
            'Erro ao calcular análise de produtos',
            ErrorCode.INTERNAL_SERVER_ERROR
          )
        )
    }
  }

  /**
   * @swagger
   * /api/metrics/dashboard:
   *   get:
   *     summary: Dashboard completo (todas as métricas)
   *     tags: [Metrics]
   *     security:
   *       - bearerAuth: []
   */
  getDashboard = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res
          .status(401)
          .json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const filters = this.extractFilters(req)

      if (!filters.panelId) {
        return res
          .status(400)
          .json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const metrics = await this.service.getDashboard(clientId, filters)

      return res
        .status(200)
        .json(createSuccessResponse(metrics, 'Dashboard calculado com sucesso'))
    } catch (error) {
      console.error('[metrics-controller] Erro ao calcular dashboard:', error)
      return res
        .status(500)
        .json(
          createErrorResponse(
            'Erro ao calcular dashboard',
            ErrorCode.INTERNAL_SERVER_ERROR
          )
        )
    }
  }
}

