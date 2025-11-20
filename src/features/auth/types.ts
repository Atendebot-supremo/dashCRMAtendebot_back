export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  client: {
    id: string
    name: string
    email: string
  }
}

export interface AuthTokenPayload {
  clientId: string
  name: string
  email: string
  role: 'client'
  iat?: number
  exp?: number
}

export interface LoginResult {
  token: string
  client: {
    id: string
    name: string
    email: string
  }
}

export interface AuthenticatedClient {
  id: string
  name: string
  email: string
}

