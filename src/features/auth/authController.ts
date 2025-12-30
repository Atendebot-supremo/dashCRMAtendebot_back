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
   *     summary: Realiza login do cliente via telefone ou email
   *     description: |
   *       Autentica o usuário usando telefone e/ou email. O backend busca o usuário no Supabase,
   *       valida na API Helena e retorna tokens de acesso.
   *       Pode enviar telefone, email ou ambos conforme documentação da API Helena.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               phone:
   *                 type: string
   *                 description: Telefone no formato brasileiro (com ou sem DDI)
   *                 example: "31999999999"
   *               email:
   *                 type: string
   *                 description: Email do usuário
   *                 example: "[email protected]"
   *             required:
   *               - phone ou email (pelo menos um deve ser enviado)
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
   *                         userName:
   *                           type: string
   *                           description: Nome de usuário (opcional)
   *                         phone:
   *                           type: string
   *                         email:
   *                           type: string
   *                           description: Email do usuário (opcional)
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Telefone/email não encontrado ou inativo
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

    const { phone, email } = req.body as LoginRequest

    // Validar que pelo menos um campo foi enviado
    if (!phone?.trim() && !email?.trim()) {
      return res.status(400).json(
        createErrorResponse(
          'Telefone ou email é obrigatório',
          ErrorCode.INVALID_INPUT
        )
      )
    }

    try {
      const result = await authService.login(phone, email)

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

  /**
   * @swagger
   * /api/auth/verify-code:
   *   post:
   *     summary: Verificar código OTP e fazer login
   *     description: |
   *       Verifica o código OTP de 6 dígitos recebido por email/SMS e, se válido, retorna tokens de acesso.
   *       
   *       **IMPORTANTE**: Envie apenas **telefone OU email** (não ambos) + código.
   *       Use o mesmo telefone/email que foi usado na rota `/api/auth/login`.
   *       
   *       Exemplos:
   *       - Com telefone: `{ "phone": "31999999999", "code": "123456" }`
   *       - Com email: `{ "email": "[email protected]", "code": "123456" }`
   *       
   *       Após 5 tentativas incorretas, o usuário é bloqueado por 15 minutos.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *             properties:
   *               phone:
   *                 type: string
   *                 description: |
   *                   Telefone usado no login (obrigatório se email não for enviado).
   *                   Use o mesmo telefone da rota /api/auth/login.
   *                 example: "31999999999"
   *               email:
   *                 type: string
   *                 description: |
   *                   Email usado no login (obrigatório se phone não for enviado).
   *                   Use o mesmo email da rota /api/auth/login.
   *                 example: "[email protected]"
   *               code:
   *                 type: string
   *                 description: Código OTP de 6 dígitos recebido por email/SMS
   *                 example: "123456"
   *           examples:
   *             comTelefone:
   *               summary: Exemplo com telefone
   *               description: Use quando fez login com telefone
   *               value:
   *                 phone: "31999999999"
   *                 code: "123456"
   *             comEmail:
   *               summary: Exemplo com email
   *               description: Use quando fez login com email
   *               value:
   *                 email: "[email protected]"
   *                 code: "123456"
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
   *                         email:
   *                           type: string
   *       400:
   *         description: Código inválido ou expirado
   *       429:
   *         description: Muitas tentativas - usuário bloqueado temporariamente
   *       502:
   *         description: Erro na comunicação com a API Helena
   */
  verifyCode = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse('Dados inválidos', ErrorCode.INVALID_INPUT, errors.array())
      )
    }

    const { phone, email, code } = req.body as LoginRequest & { code?: string }

    // Validar que pelo menos um campo foi enviado
    if (!phone?.trim() && !email?.trim()) {
      return res.status(400).json(
        createErrorResponse(
          'Telefone ou email é obrigatório',
          ErrorCode.INVALID_INPUT
        )
      )
    }

    // Validar código
    if (!code?.trim()) {
      return res.status(400).json(
        createErrorResponse(
          'Código é obrigatório',
          ErrorCode.INVALID_INPUT
        )
      )
    }

    if (!/^[0-9]{6}$/.test(code)) {
      return res.status(400).json(
        createErrorResponse(
          'Código deve ter exatamente 6 dígitos',
          ErrorCode.INVALID_INPUT
        )
      )
    }

    try {
      const result = await authService.verifyCode(phone, email, code)

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
          case ErrorCode.TOO_MANY_REQUESTS:
            return res.status(429).json(error)
          case ErrorCode.BAD_GATEWAY:
          case ErrorCode.SERVICE_UNAVAILABLE:
            return res.status(502).json(error)
          default:
            return res.status(400).json(error)
        }
      }

      console.error('[auth-controller] Erro inesperado em verify-code:', error)
      return res.status(500).json(
        createErrorResponse(
          'Erro ao verificar código',
          ErrorCode.INTERNAL_SERVER_ERROR
        )
      )
    }
  }
}

export const authController = new AuthController()
