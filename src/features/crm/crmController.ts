import { Response } from 'express'
import { validationResult } from 'express-validator'
import { CrmService } from './crmService'
import { createSuccessResponse, createErrorResponse, ErrorCode, createPaginatedResponse } from '../../types'
import type { AuthRequest } from '../../middleware/auth.middleware'

export default class CrmController {
  private service = new CrmService()

  /**
   * @swagger
   * /api/crm/panels:
   *   get:
   *     summary: Lista painéis CRM
   *     tags: [CRM]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de painéis
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     items:
   *                       type: array
   *                     totalItems:
   *                       type: number
   */
  getPanels = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res.status(401).json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const panelsResponse = await this.service.getPanels(clientId)

      return res.status(200).json(
        createSuccessResponse(
          {
            items: panelsResponse.items || [],
            totalItems: panelsResponse.totalItems || 0
          },
          'Painéis listados com sucesso'
        )
      )
    } catch (error) {
      console.error('[crm-controller] Erro ao listar painéis:', error)
      return res
        .status(500)
        .json(createErrorResponse('Erro ao buscar painéis', ErrorCode.INTERNAL_SERVER_ERROR))
    }
  }

  /**
   * @swagger
   * /api/crm/panels/{id}:
   *   get:
   *     summary: Detalhes de um painel específico
   *     tags: [CRM]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Detalhes do painel
   */
  getPanelById = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id
      const panelId = req.params.id

      if (!clientId) {
        return res.status(401).json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      if (!panelId) {
        return res.status(400).json(createErrorResponse('ID do painel é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const panel = await this.service.getPanelById(clientId, panelId)

      return res.status(200).json(createSuccessResponse(panel, 'Painel encontrado com sucesso'))
    } catch (error) {
      console.error('[crm-controller] Erro ao buscar painel:', error)
      return res
        .status(500)
        .json(createErrorResponse('Erro ao buscar painel', ErrorCode.INTERNAL_SERVER_ERROR))
    }
  }

  /**
   * @swagger
   * /api/crm/cards:
   *   get:
   *     summary: Lista cards com filtros
   *     tags: [CRM]
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
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: channelId
   *         schema:
   *           type: string
   *       - in: query
   *         name: stepId
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Lista de cards
   */
  getCards = async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json(
          createErrorResponse(
            'Dados de entrada inválidos',
            ErrorCode.INVALID_INPUT,
            errors.array()
          )
        )
      }

      const clientId = req.context?.user?.id

      if (!clientId) {
        return res.status(401).json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const { panelId, startDate, endDate, userId, channelId, stepId, page, pageSize } = req.query

      if (!panelId) {
        return res.status(400).json(createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const filters: {
        panelId: string
        startDate?: string
        endDate?: string
        userId?: string
        channelId?: string
        stepId?: string
        page?: number
        pageSize?: number
      } = {
        panelId: panelId as string
      }

      if (startDate) filters.startDate = startDate as string
      if (endDate) filters.endDate = endDate as string
      if (userId) filters.userId = userId as string
      if (channelId) filters.channelId = channelId as string
      if (stepId) filters.stepId = stepId as string
      if (page) filters.page = Number(page)
      if (pageSize) filters.pageSize = Number(pageSize)

      const cardsResponse = await this.service.getCards(clientId, filters)

      return res.status(200).json(
        createPaginatedResponse(
          cardsResponse.items,
          {
            totalItems: cardsResponse.totalItems || 0,
            totalPages: cardsResponse.totalPages || 0,
            pageNumber: cardsResponse.pageNumber || 1,
            pageSize: cardsResponse.pageSize || 100
          },
          'Cards listados com sucesso'
        )
      )
    } catch (error) {
      console.error('[crm-controller] Erro ao listar cards:', error)
      return res
        .status(500)
        .json(createErrorResponse('Erro ao buscar cards', ErrorCode.INTERNAL_SERVER_ERROR))
    }
  }

  /**
   * @swagger
   * /api/crm/cards/{id}:
   *   get:
   *     summary: Detalhes de um card específico
   *     tags: [CRM]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Detalhes do card
   */
  getCardById = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id
      const cardId = req.params.id

      if (!clientId) {
        return res.status(401).json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      if (!cardId) {
        return res.status(400).json(createErrorResponse('ID do card é obrigatório', ErrorCode.INVALID_INPUT))
      }

      const card = await this.service.getCardById(clientId, cardId)

      return res.status(200).json(createSuccessResponse(card, 'Card encontrado com sucesso'))
    } catch (error) {
      console.error('[crm-controller] Erro ao buscar card:', error)
      return res
        .status(500)
        .json(createErrorResponse('Erro ao buscar card', ErrorCode.INTERNAL_SERVER_ERROR))
    }
  }

  /**
   * @swagger
   * /api/crm/users:
   *   get:
   *     summary: Lista usuários/vendedores
   *     tags: [CRM]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de usuários
   */
  getUsers = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res.status(401).json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const usersResponse = await this.service.getUsers(clientId)

      return res.status(200).json(
        createSuccessResponse(
          {
            items: usersResponse.items,
            totalItems: usersResponse.totalItems
          },
          'Usuários listados com sucesso'
        )
      )
    } catch (error) {
      console.error('[crm-controller] Erro ao listar usuários:', error)
      return res
        .status(500)
        .json(createErrorResponse('Erro ao buscar usuários', ErrorCode.INTERNAL_SERVER_ERROR))
    }
  }

  /**
   * @swagger
   * /api/crm/channels:
   *   get:
   *     summary: Lista canais de comunicação
   *     tags: [CRM]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de canais
   */
  getChannels = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res.status(401).json(createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED))
      }

      const channelsResponse = await this.service.getChannels(clientId)

      return res.status(200).json(
        createSuccessResponse(
          {
            items: channelsResponse.items,
            totalItems: channelsResponse.totalItems
          },
          'Canais listados com sucesso'
        )
      )
    } catch (error) {
      console.error('[crm-controller] Erro ao listar canais:', error)
      return res
        .status(500)
        .json(createErrorResponse('Erro ao buscar canais', ErrorCode.INTERNAL_SERVER_ERROR))
    }
  }
}

