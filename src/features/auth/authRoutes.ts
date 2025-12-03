import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { body } from 'express-validator'
import { authController } from './authController'

const router = Router()

// Rate limiting para login: 10 tentativas por 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente mais tarde.',
    code: 'TOO_MANY_REQUESTS'
  }
})

// Validação do telefone
const validateLoginRequest = [
  body('phone')
    .notEmpty()
    .withMessage('Telefone é obrigatório')
    .isString()
    .withMessage('Telefone deve ser uma string')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefone deve ter entre 10 e 15 caracteres')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Telefone contém caracteres inválidos')
]

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticação
 */
router.post('/login', loginLimiter, validateLoginRequest, authController.login)

export default router
