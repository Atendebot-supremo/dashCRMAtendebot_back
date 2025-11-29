// Request para login via telefone
export interface LoginRequest {
  phone: string
}

// Resposta da API Helena /auth/v1/login/authenticate/external
export interface HelenaAuthResponse {
  userId: string
  accessToken: string
  expiresIn: string
  refreshToken: string
  tenantId: string
  urlRedirect: string
}

// Resposta do nosso endpoint de login
export interface LoginResponse {
  token: string
  helena: HelenaAuthResponse
  user: {
    id: string
    name: string
    phone: string
  }
}

// Payload do JWT interno
export interface AuthTokenPayload {
  userId: string
  name: string
  phone: string
  helenaUserId: string
  tenantId: string
  role: 'client'
  iat?: number
  exp?: number
}

// Resultado do login
export interface LoginResult {
  token: string
  helena: HelenaAuthResponse
  user: {
    id: string
    name: string
    phone: string
  }
}

// Cliente autenticado
export interface AuthenticatedClient {
  id: string
  name: string
  phone: string
  helenaUserId: string
  tenantId: string
}
