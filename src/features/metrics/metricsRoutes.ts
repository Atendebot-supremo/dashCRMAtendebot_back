import { Router } from 'express'
import { query } from 'express-validator'
import rateLimit from 'express-rate-limit'
import MetricsController from './metricsController'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()
const controller = new MetricsController()

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requisições por minuto
  message: 'Muitas requisições do mesmo IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false
})

router.use(authMiddleware)
router.use(limiter)

const validateMetrics = [
  query('panelId').notEmpty().withMessage('panelId é obrigatório'),
  query('startDate').optional().isISO8601().withMessage('startDate deve ser uma data válida (ISO 8601)'),
  query('endDate').optional().isISO8601().withMessage('endDate deve ser uma data válida (ISO 8601)'),
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('period deve ser: day, week, month ou year')
]

router.get('/funnel', validateMetrics, controller.getFunnelMetrics)
router.get('/revenue', validateMetrics, controller.getRevenueMetrics)
router.get('/conversion', validateMetrics, controller.getConversionMetrics)
router.get('/loss', validateMetrics, controller.getLossAnalysis)
router.get('/temporal', validateMetrics, controller.getTemporalComparison)
router.get('/seller-performance', validateMetrics, controller.getSellerPerformance)
router.get('/products', validateMetrics, controller.getProductsAnalysis)
router.get('/dashboard', validateMetrics, controller.getDashboard)

export default router

