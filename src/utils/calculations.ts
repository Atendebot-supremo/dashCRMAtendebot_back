type DateLike = string | number | Date | null | undefined

const toValidDate = (value: DateLike): Date | null => {
  if (value === null || value === undefined) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

const differenceInMinutes = (start: Date, end: Date): number => {
  const diff = end.getTime() - start.getTime()
  if (diff <= 0) {
    return 0
  }

  return diff / 60000
}

const differenceInDays = (start: Date, end: Date): number => {
  const diff = end.getTime() - start.getTime()
  if (diff <= 0) {
    return 0
  }

  return diff / (1000 * 60 * 60 * 24)
}

export const calculateConversionRate = (current: number, previous: number): number => {
  if (current <= 0 || previous <= 0) {
    return 0
  }

  return (current / previous) * 100
}

export const calculateAverageTicket = (totalRevenue: number, closedDeals: number): number => {
  if (closedDeals <= 0) {
    return 0
  }

  return totalRevenue / closedDeals
}

export interface TimeTrackedRecord {
  createdAt?: DateLike
  updatedAt?: DateLike
}

export const calculateSalesCycle = <T extends TimeTrackedRecord>(records: T[]): number => {
  if (!records.length) {
    return 0
  }

  const durations = records
    .map((record) => {
      const createdAt = toValidDate(record.createdAt)
      const updatedAt = toValidDate(record.updatedAt)

      if (!createdAt || !updatedAt) {
        return 0
      }

      return differenceInDays(createdAt, updatedAt)
    })
    .filter((duration) => duration > 0)

  if (!durations.length) {
    return 0
  }

  return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
}

export interface ResponseTrackedRecord {
  startedAt?: DateLike
  respondedAt?: DateLike
}

export const calculateResponseTime = <T extends ResponseTrackedRecord>(records: T[]): number => {
  if (!records.length) {
    return 0
  }

  const durations = records
    .map((record) => {
      const startedAt = toValidDate(record.startedAt)
      const respondedAt = toValidDate(record.respondedAt)

      if (!startedAt || !respondedAt) {
        return 0
      }

      return differenceInMinutes(startedAt, respondedAt)
    })
    .filter((duration) => duration > 0)

  if (!durations.length) {
    return 0
  }

  return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
}

export const groupBy = <T, K extends string | number | symbol>(
  items: T[],
  selector: (item: T) => K
): Map<K, T[]> => {
  const map = new Map<K, T[]>()

  items.forEach((item) => {
    const key = selector(item)
    const current = map.get(key) ?? []
    current.push(item)
    map.set(key, current)
  })

  return map
}

export const sumBy = <T>(items: T[], selector: (item: T) => number): number => {
  if (!items.length) {
    return 0
  }

  return items.reduce((sum, item) => {
    const value = selector(item)
    if (!Number.isFinite(value)) {
      return sum
    }

    return sum + value
  }, 0)
}

export const average = (values: number[]): number => {
  const validValues = values.filter((value) => Number.isFinite(value) && value > 0)

  if (!validValues.length) {
    return 0
  }

  const total = validValues.reduce((sum, value) => sum + value, 0)
  return total / validValues.length
}

export const mean = average

export const clamp = (value: number, min: number, max: number): number => {
  if (value <= min) {
    return min
  }

  if (value >= max) {
    return max
  }

  return value
}

