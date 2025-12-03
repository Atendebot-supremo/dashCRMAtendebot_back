import type { Request } from 'express'

export type AuthRole = 'client' | 'admin' | 'operator'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: AuthRole
  // Novos campos para integração Helena
  phone?: string
  helenaUserId?: string
  tenantId?: string
}

export interface RequestContext {
  user?: AuthenticatedUser
  requestId?: string
}

export interface PaginationMeta {
  totalItems: number
  totalPages: number
  pageNumber: number
  pageSize: number
}

export type PaginatedItems<T> = {
  items: T[]
} & PaginationMeta

export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  BAD_REQUEST = 'BAD_REQUEST',
  BAD_GATEWAY = 'BAD_GATEWAY',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: ErrorCode
  details?: unknown
}

export interface ApiError extends APIResponse<undefined> {
  success: false
  error: string
  code: ErrorCode
}

export interface ApiSuccess<T> extends APIResponse<T> {
  success: true
  data: T
}

export const createSuccessResponse = <T>(
  data: T,
  message = 'Operação realizada com sucesso'
): ApiSuccess<T> => {
  return {
    success: true,
    data,
    message
  }
}

export const createPaginatedResponse = <T>(
  items: T[],
  meta: PaginationMeta,
  message = 'Operação realizada com sucesso'
): ApiSuccess<PaginatedItems<T>> => {
  return createSuccessResponse(
    {
      items,
      totalItems: meta.totalItems,
      totalPages: meta.totalPages,
      pageNumber: meta.pageNumber,
      pageSize: meta.pageSize
    },
    message
  )
}

export const createErrorResponse = (
  error: string,
  code: ErrorCode,
  details?: unknown
): ApiError => {
  return {
    success: false,
    error,
    code,
    details
  }
}

export type WithPagination<T> = {
  data: PaginatedItems<T>
} & ApiSuccess<PaginatedItems<T>>

export type AuthenticatedClient = {
  id: string
  name: string
  phone: string
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext
    }
  }
}

export type RequestWithContext = Request & { context?: RequestContext }

export {}
