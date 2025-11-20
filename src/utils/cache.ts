import NodeCache from 'node-cache'

const defaultTtlMs = Number(process.env.CACHE_TTL) || 300_000
const defaultTtlSeconds = Math.max(1, Math.floor(defaultTtlMs / 1000))
const checkPeriodSeconds = Math.max(30, Math.floor(defaultTtlSeconds / 2))

const cache = new NodeCache({
  stdTTL: defaultTtlSeconds,
  checkperiod: checkPeriodSeconds,
  useClones: false
})

export const getCached = <T>(key: string): T | undefined => {
  if (!key) {
    return undefined
  }

  return cache.get<T>(key)
}

export const setCached = <T>(key: string, value: T, ttlMs?: number): boolean => {
  if (!key) {
    return false
  }

  if (typeof ttlMs === 'number' && ttlMs > 0) {
    const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000))
    return cache.set(key, value, ttlSeconds)
  }

  return cache.set(key, value)
}

export const deleteCached = (key: string): boolean => {
  if (!key) {
    return false
  }

  return cache.del(key) > 0
}

export const flushCache = (): void => {
  cache.flushAll()
}

export const getCacheInstance = (): NodeCache => cache

