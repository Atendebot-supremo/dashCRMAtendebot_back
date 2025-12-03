import { Router } from 'express'
import { query, param } from 'express-validator'
import rateLimit from 'express-rate-limit'
import CrmController from './crmController'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()
const controller = new CrmController()

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requisições por minuto
  message: 'Muitas requisições do mesmo IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false
})

router.use(authMiddleware)
router.use(limiter)

const validateGetCards = [
  query('panelId').notEmpty().withMessage('panelId é obrigatório'),
  query('startDate').optional().isISO8601().withMessage('startDate deve ser uma data válida (ISO 8601)'),
  query('endDate').optional().isISO8601().withMessage('endDate deve ser uma data válida (ISO 8601)'),
  query('page').optional().isInt({ min: 1 }).withMessage('page deve ser um número inteiro maior que 0'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('pageSize deve ser um número entre 1 e 1000')
]

const validatePanelId = [param('id').notEmpty().withMessage('ID do painel é obrigatório')]

const validateCardId = [param('id').notEmpty().withMessage('ID do card é obrigatório')]
const validateAgentId = [param('id').notEmpty().withMessage('ID do agente é obrigatório')]
const validateGetAgents = [query('panelId').notEmpty().withMessage('panelId é obrigatório')]

router.get('/panels', controller.getPanels)
router.get('/panels/:id', validatePanelId, controller.getPanelById)
router.get('/cards', validateGetCards, controller.getCards)
router.get('/cards/:id', validateCardId, controller.getCardById)
router.get('/agents', validateGetAgents, controller.getAgents)
router.get('/agents/:id', validateAgentId, controller.getAgentById)

export default router

