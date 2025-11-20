import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { body } from 'express-validator'
import { authController } from './authController'

const router = Router()

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

const validateLoginRequest = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isString().isLength({ min: 6 }).withMessage('Senha inválida')
]

router.post('/login', loginLimiter, validateLoginRequest, authController.login)

export default router

