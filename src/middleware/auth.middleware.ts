import { NextFunction, Response } from 'express'
import { authService } from '../features/auth/authService'
import { createErrorResponse, ErrorCode } from '../types'
import type { RequestWithContext } from '../types'

export type AuthRequest = RequestWithContext

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res
      .status(401)
      .json(createErrorResponse('Token não informado', ErrorCode.UNAUTHORIZED))
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    return res
      .status(401)
      .json(createErrorResponse('Formato de token inválido', ErrorCode.UNAUTHORIZED))
  }

  try {
    const payload = authService.verifyToken(token)

    req.context = {
      user: {
        id: payload.userId,
        name: payload.name,
        email: '', // Não usamos mais email
        role: payload.role,
        // Dados adicionais da Helena
        phone: payload.phone,
        helenaUserId: payload.helenaUserId,
        tenantId: payload.tenantId
      }
    }

    return next()
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: ErrorCode }).code === ErrorCode.UNAUTHORIZED
    ) {
      return res.status(401).json(error)
    }

    console.error('[auth-middleware] Erro inesperado na validação de token:', error)
    return res
      .status(401)
      .json(createErrorResponse('Token inválido', ErrorCode.UNAUTHORIZED))
  }
}
