import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { authService } from './authService'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '../../types'
import type { LoginRequest } from './types'

export class AuthController {
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Realiza login do cliente e retorna JWT
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Credenciais inválidas
   */
  login = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse('Dados inválidos', ErrorCode.INVALID_INPUT, errors.array())
      )
    }

    const { email, password } = req.body as LoginRequest

    try {
      const result = await authService.login(email, password)

      return res.status(200).json(
        createSuccessResponse(result, 'Login realizado com sucesso')
      )
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: ErrorCode }).code === ErrorCode.UNAUTHORIZED
      ) {
        return res.status(401).json(error)
      }

      console.error('[auth-controller] Erro inesperado no login:', error)
      return res.status(500).json(
        createErrorResponse(
          'Erro ao processar login',
          ErrorCode.INTERNAL_SERVER_ERROR
        )
      )
    }
  }
}

export const authController = new AuthController()

