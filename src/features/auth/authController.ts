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
   *     summary: Realiza login do cliente via telefone
   *     description: |
   *       Autentica o usuário usando o telefone. O backend busca o usuário no Supabase,
   *       valida na API Helena e retorna tokens de acesso.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phone
   *             properties:
   *               phone:
   *                 type: string
   *                 description: Telefone no formato brasileiro (com ou sem DDI)
   *                 example: "31999999999"
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: JWT para autenticação nas requisições
   *                     helena:
   *                       type: object
   *                       properties:
   *                         accessToken:
   *                           type: string
   *                         userId:
   *                           type: string
   *                         tenantId:
   *                           type: string
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         name:
   *                           type: string
   *                         phone:
   *                           type: string
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Telefone não encontrado ou inativo
   *       502:
   *         description: Erro na comunicação com a API Helena
   */
  login = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse('Dados inválidos', ErrorCode.INVALID_INPUT, errors.array())
      )
    }

    const { phone } = req.body as LoginRequest

    if (!phone?.trim()) {
      return res.status(400).json(
        createErrorResponse('Telefone é obrigatório', ErrorCode.INVALID_INPUT)
      )
    }

    try {
      const result = await authService.login(phone)

      return res.status(200).json(
        createSuccessResponse(result, 'Login realizado com sucesso')
      )
    } catch (error) {
      // Erros conhecidos do authService
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error
      ) {
        const errorObj = error as { code: ErrorCode; error: string }

        switch (errorObj.code) {
          case ErrorCode.UNAUTHORIZED:
            return res.status(401).json(error)
          case ErrorCode.NOT_FOUND:
            return res.status(404).json(error)
          case ErrorCode.BAD_GATEWAY:
          case ErrorCode.SERVICE_UNAVAILABLE:
            return res.status(502).json(error)
          default:
            return res.status(400).json(error)
        }
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
