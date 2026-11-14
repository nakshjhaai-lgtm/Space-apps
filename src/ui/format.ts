const DEG = '\u00b0'

export const degrees = (value: number, digits = 2) =>
  `${value >= 0 ? '+' : '\u2212'}${Math.abs(value).toFixed(digits)}${DEG}`

export const percent = (fraction: number, digits = 0) => `${(fraction * 100).toFixed(digits)}%`

/** Hours, or days and hours past two days, because the numbers this tool reports run to weeks. */
export const hours = (value: number) => {
  if (value >= 48) return `${Math.floor(value / 24)}\u00a0d ${Math.round(value % 24)}\u00a0h`
  return value >= 10 ? `${value.toFixed(0)}\u00a0h` : `${value.toFixed(1)}\u00a0h`
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const instantFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

export const date = (ms: number) => dateFormat.format(new Date(ms))

export const instant = (ms: number) => `${instantFormat.format(new Date(ms))} UTC`

export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export const isoInstant = (ms: number) => new Date(ms).toISOString().slice(0, 16)

export const parseDay = (value: string | null, fallback: number) => {
  if (!value) return fallback
  const ms = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(ms) ? ms : fallback
}

export const parseInstant = (value: string | null, fallback: number) => {
  if (!value) return fallback
  const normalised = value.length === 16 ? `${value}:00Z` : value
  const ms = Date.parse(normalised)
  return Number.isFinite(ms) ? ms : fallback
}

export const roundToHour = (ms: number) => Math.round(ms / 3_600_000) * 3_600_000

/** Parses a numeric query parameter and holds it inside a rounded range. */
export function clampNumber(value: string | number | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || value === null || value === '') return fallback
  return Math.max(min, Math.min(max, Math.round(parsed)))
}
