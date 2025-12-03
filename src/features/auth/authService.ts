import jwt from 'jsonwebtoken'
import axios from 'axios'
import { getUserByPhone, getUserByEmail } from '../../config/supabase'
import { createErrorResponse, ErrorCode } from '../../types'
import type { AuthTokenPayload, LoginResult, HelenaAuthResponse } from './types'

const TOKEN_EXPIRATION = '8h'
const HELENA_API_URL = process.env.HELENA_API_URL?.trim() || 'https://api.helena.run'

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

// Normalizar telefone para formato internacional
const normalizePhone = (phone: string): string => {
  // Remove tudo que não é número
  let normalized = phone.replace(/\D/g, '')

  // Se começar com 0, remove
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1)
  }

  // Se não começar com 55, adiciona (código do Brasil)
  if (!normalized.startsWith('55')) {
    normalized = '55' + normalized
  }

  return normalized
}

export class AuthService {
  // Buscar usuário no Supabase pelo telefone
  async findUserByPhone(phone: string) {
    const normalizedPhone = normalizePhone(phone)
    const user = await getUserByPhone(normalizedPhone)

    if (!user) {
      throw createAuthError('Telefone não encontrado', ErrorCode.UNAUTHORIZED)
    }

    if (!user.active) {
      throw createAuthError('Usuário inativo', ErrorCode.UNAUTHORIZED)
    }

    return user
  }

  // Buscar usuário no Supabase pelo email
  async findUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await getUserByEmail(normalizedEmail)

    if (!user) {
      throw createAuthError('Email não encontrado', ErrorCode.UNAUTHORIZED)
    }

    if (!user.active) {
      throw createAuthError('Usuário inativo', ErrorCode.UNAUTHORIZED)
    }

    return user
  }

  // Buscar usuário por telefone ou email
  async findUser(phone?: string, email?: string) {
    if (phone) {
      return await this.findUserByPhone(phone)
    }

    if (email) {
      return await this.findUserByEmail(email)
    }

    throw createAuthError('Telefone ou email é obrigatório', ErrorCode.INVALID_INPUT)
  }

  // Autenticar via API Helena (aceita phoneNumber e/ou email)
  async authenticateWithHelena(
    phone: string | undefined,
    email: string | undefined,
    helenaToken: string
  ): Promise<HelenaAuthResponse> {
    // Preparar body da requisição conforme documentação Helena
    const body: { phoneNumber?: string; email?: string } = {}

    if (phone) {
      body.phoneNumber = normalizePhone(phone)
    }

    if (email) {
      body.email = email.trim().toLowerCase()
    }

    // Validar que pelo menos um campo foi enviado
    if (!body.phoneNumber && !body.email) {
      throw createAuthError('Telefone ou email é obrigatório', ErrorCode.INVALID_INPUT)
    }

    try {
      const response = await axios.post<HelenaAuthResponse>(
        `${HELENA_API_URL}/auth/v1/login/authenticate/external`,
        body,
        {
          headers: {
            Authorization: `Bearer ${helenaToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message || error.message

        console.error('[auth-service] Erro na autenticação Helena:', {
          status,
          message,
          phone: body.phoneNumber,
          email: body.email
        })

        if (status === 401) {
          throw createAuthError('Token Helena inválido', ErrorCode.UNAUTHORIZED)
        }

        if (status === 404) {
          throw createAuthError('Usuário não encontrado na Helena', ErrorCode.NOT_FOUND)
        }

        throw createAuthError(
          `Erro na autenticação: ${message}`,
          ErrorCode.BAD_GATEWAY
        )
      }

      throw createAuthError('Erro ao conectar com Helena', ErrorCode.SERVICE_UNAVAILABLE)
    }
  }

  // Gerar token JWT interno
  generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRATION })
  }

  // Login completo: busca no Supabase + autentica na Helena + gera JWT
  async login(phone?: string, email?: string): Promise<LoginResult> {
    // 1. Buscar usuário no Supabase (por telefone ou email)
    const user = await this.findUser(phone, email)

    // 2. Autenticar na Helena com o token do usuário
    // Envia tanto phoneNumber quanto email se disponíveis (conforme documentação Helena)
    const helenaAuth = await this.authenticateWithHelena(
      phone || user.phone,
      email || user.email,
      user.helena_token
    )

    // 3. Gerar JWT interno
    const token = this.generateToken({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      helenaUserId: helenaAuth.userId,
      tenantId: helenaAuth.tenantId,
      role: 'client'
    })

    return {
      token,
      helena: helenaAuth,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone
      }
    }
  }

  // Verificar token JWT
  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, getJwtSecret()) as AuthTokenPayload
    } catch (error) {
      throw createAuthError('Token inválido ou expirado', ErrorCode.UNAUTHORIZED)
    }
  }
}

export const authService = new AuthService()
