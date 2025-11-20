import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getClientByEmail } from '../../config/clients'
import { createErrorResponse, ErrorCode } from '../../types'
import type { AuthTokenPayload, LoginResult } from './types'

const TOKEN_EXPIRATION = '1h'

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET não configurado nas variáveis de ambiente.')
  }

  return secret
}

const createAuthError = (message: string, code: ErrorCode) => {
  return createErrorResponse(message, code)
}

export class AuthService {
  async validateCredentials(email: string, password: string): Promise<LoginResult['client']> {
    const client = getClientByEmail(email)

    if (!client) {
      throw createAuthError('Credenciais inválidas', ErrorCode.UNAUTHORIZED)
    }

    const isPasswordValid = await bcrypt.compare(password, client.passwordHash)

    if (!isPasswordValid) {
      throw createAuthError('Credenciais inválidas', ErrorCode.UNAUTHORIZED)
    }

    return {
      id: client.clientId,
      name: client.name,
      email: client.email
    }
  }

  generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRATION })
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const client = await this.validateCredentials(email, password)
    const token = this.generateToken({
      clientId: client.id,
      name: client.name,
      email: client.email,
      role: 'client'
    })

    return {
      token,
      client
    }
  }

  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, getJwtSecret()) as AuthTokenPayload
    } catch (error) {
      throw createAuthError('Token inválido ou expirado', ErrorCode.UNAUTHORIZED)
    }
  }
}

export const authService = new AuthService()

