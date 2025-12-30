import jwt from 'jsonwebtoken'
import axios from 'axios'
import { 
  getUserByPhone, 
  getUserByEmail, 
  updateUserOTP, 
  getUserWithOTPData, 
  clearUserOTP, 
  incrementOTPAttempts 
} from '../../config/supabase'
import { createErrorResponse, ErrorCode } from '../../types'
import type { AuthTokenPayload, LoginResult, HelenaAuthResponse } from './types'

const TOKEN_EXPIRATION = '8h'
const HELENA_API_URL = process.env.HELENA_API_URL?.trim() || 'https://api.helena.run'

// Configurações OTP
const OTP_EXPIRATION_MINUTES = 5
const OTP_WEBHOOK_URL = 'https://webhook.labfy.co/webhook/9c45b8e2-75c6-42e6-90d8-954182243673'

// Gerar código OTP de 6 dígitos
const generateOTPCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Calcular data de expiração
const calculateExpiry = (minutes: number): string => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + minutes)
  return now.toISOString()
}

// Verificar se data expirou
const isExpired = (expiryDate: string): boolean => {
  return new Date() > new Date(expiryDate)
}

// Limpar telefone (remover caracteres não numéricos)
const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '')
}

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

    // 4. Gerar e enviar código OTP (assíncrono, não bloqueia a resposta)
    this.sendOTPCodeAsync(user, phone, email).catch((error) => {
      console.error('[auth-service] Erro ao enviar código OTP (não crítico):', error)
    })

    return {
      token,
      helena: helenaAuth,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        ...(user.userName && { userName: user.userName }),
        ...(user.email && { email: user.email })
      }
    }
  }

  // Enviar código OTP de forma assíncrona (não bloqueia o login)
  private async sendOTPCodeAsync(
    user: Awaited<ReturnType<typeof this.findUser>>,
    phone?: string,
    email?: string
  ): Promise<void> {
    try {
      // Determinar tipo de identificador
      const identifierType: 'email' | 'phone' = email ? 'email' : 'phone'
      const identifier = email || phone || user.phone

      // Gerar código OTP
      const otpCode = generateOTPCode()
      const expiryTime = calculateExpiry(OTP_EXPIRATION_MINUTES)

      // Salvar no banco
      const updated = await updateUserOTP(user.id, {
        otp_code: otpCode,
        otp_expiry: expiryTime,
        otp_attempts: 0,
        otp_locked_until: null
      })

      if (!updated) {
        console.error('[auth-service] Erro ao salvar código OTP no banco')
        return
      }

      // Preparar payload do webhook
      const webhookPayload = {
        // Dados do usuário
        email: user.email || null,
        phone: user.phone,
        userName: user.name || 'Usuário',
        userId: user.id,
        
        // Dados do OTP
        code: otpCode,
        expiresAt: expiryTime,
        
        // Tipo de envio (para o n8n saber como enviar)
        identifierType,
        type: 'login_otp',
        
        // Metadados
        timestamp: new Date().toISOString()
      }

      console.log('[auth-service] 📤 Enviando código OTP via webhook:', {
        webhookUrl: OTP_WEBHOOK_URL,
        userId: user.id,
        identifierType,
        destination: identifierType === 'email' ? user.email : user.phone
      })

      // Enviar para webhook
      const response = await axios.post(OTP_WEBHOOK_URL, webhookPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      })

      console.log('[auth-service] ✅ Código OTP enviado com sucesso!', {
        status: response.status,
        destination: identifierType === 'email' ? user.email : user.phone,
        code: otpCode
      })
    } catch (error) {
      // Não falhar se o envio falhar - login já foi bem-sucedido
      if (axios.isAxiosError(error)) {
        console.error('[auth-service] ❌ Erro ao enviar código OTP via webhook:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText
        })
      } else {
        console.error('[auth-service] ❌ Erro desconhecido ao enviar código OTP:', error)
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

  // Verificar código OTP e fazer login (Etapa 2)
  async verifyCode(phone?: string, email?: string, code?: string): Promise<LoginResult> {
    // Validar código
    const codeRegex = /^[0-9]{6}$/
    if (!code || !codeRegex.test(code)) {
      throw createAuthError('Código inválido', ErrorCode.INVALID_INPUT)
    }

    // Validar que pelo menos um identificador foi enviado
    if (!phone?.trim() && !email?.trim()) {
      throw createAuthError('Telefone ou email é obrigatório', ErrorCode.INVALID_INPUT)
    }

    // Determinar tipo automaticamente (email tem prioridade se ambos forem enviados)
    const identifierType: 'email' | 'phone' = email ? 'email' : 'phone'
    const identifier = email || phone

    if (!identifier) {
      throw createAuthError('Telefone ou email é obrigatório', ErrorCode.INVALID_INPUT)
    }

    // Normalizar identifier
    const normalizedIdentifier = identifierType === 'phone'
      ? cleanPhone(identifier)
      : identifier.toLowerCase().trim()

    // Buscar usuário com dados OTP
    const user = await getUserWithOTPData(normalizedIdentifier, identifierType)

    if (!user) {
      throw createAuthError('Código inválido ou expirado', ErrorCode.INVALID_INPUT)
    }

    // Verificar se está bloqueado
    if (user.otp_locked_until) {
      const lockedUntil = new Date(user.otp_locked_until)
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
        throw createAuthError(
          `Muitas tentativas. Aguarde ${minutesLeft} minuto(s) antes de tentar novamente.`,
          ErrorCode.TOO_MANY_REQUESTS
        )
      }
    }

    // Verificar se código existe
    if (!user.otp_code) {
      throw createAuthError('Código inválido ou expirado', ErrorCode.INVALID_INPUT)
    }

    // Verificar expiração
    if (!user.otp_expiry || isExpired(user.otp_expiry)) {
      // Limpar código expirado
      await clearUserOTP(user.id)
      throw createAuthError('Código inválido ou expirado', ErrorCode.INVALID_INPUT)
    }

    // Verificar se código corresponde
    if (user.otp_code !== code) {
      // Incrementar tentativas
      const newAttempts = (user.otp_attempts || 0) + 1
      const OTP_MAX_ATTEMPTS = 5
      const OTP_LOCK_MINUTES = 15
      const shouldLock = newAttempts >= OTP_MAX_ATTEMPTS
      const lockUntil = shouldLock ? calculateExpiry(OTP_LOCK_MINUTES) : undefined

      await incrementOTPAttempts(user.id, user.otp_attempts || 0, lockUntil)

      throw createAuthError(
        'Código inválido ou expirado',
        ErrorCode.INVALID_INPUT
      )
    }

    // ✅ Código correto! Autenticar na Helena e gerar JWT

    // Autenticar na Helena
    const helenaAuth = await this.authenticateWithHelena(
      user.phone,
      user.email || undefined,
      user.helena_token
    )

    // Gerar JWT interno
    const token = this.generateToken({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      helenaUserId: helenaAuth.userId,
      tenantId: helenaAuth.tenantId,
      role: 'client'
    })

    // Limpar dados OTP
    await clearUserOTP(user.id)

    console.log('[auth-service] ✅ Login OTP bem-sucedido:', { 
      identifierType, 
      identifier: normalizedIdentifier,
      userId: user.id 
    })

    return {
      token,
      helena: helenaAuth,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        ...(user.userName && { userName: user.userName }),
        ...(user.email && { email: user.email })
      }
    }
  }
}

export const authService = new AuthService()
