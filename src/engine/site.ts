import { directionFromSite } from './geometry.ts'
import { selenographicToBody } from './lunarFrame.ts'
import { cross, dot, type V3 } from './vec.ts'

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

export interface LocalFrame {
  up: V3
  east: V3
  north: V3
}

export function localFrame(lonDeg: number, latDeg: number): LocalFrame {
  const up = selenographicToBody(lonDeg, latDeg)
  const lon = lonDeg * D2R
  const east: V3 = [-Math.sin(lon), Math.cos(lon), 0]
  return { up, east, north: cross(up, east) }
}

export interface SkyPosition {
  /** Degrees above the geometric, terrain-free horizon. */
  elevation: number
  /** Degrees clockwise from local north. */
  azimuth: number
}

/**
 * Position of a body as seen from a point on the surface. The body vector is
 * measured from the Moon's centre, so the 1737 km offset of the observer is
 * included: at the Earth's distance that parallax reaches 0.26 degrees.
 */
export function skyPosition(bodyVecKm: V3, frame: LocalFrame): SkyPosition {
  const dir = directionFromSite(bodyVecKm, frame.up)
  return {
    elevation: Math.asin(Math.max(-1, Math.min(1, dot(dir, frame.up)))) * R2D,
    azimuth: normalizeAzimuth(Math.atan2(dot(dir, frame.east), dot(dir, frame.north)) * R2D),
  }
}

export const normalizeAzimuth = (deg: number) => ((deg % 360) + 360) % 360

export type HorizonMask = number[]

export const FLAT_HORIZON: HorizonMask = new Array(16).fill(0)

/** Horizon elevation for an azimuth, linearly interpolated between sector centres. */
export function horizonAt(mask: HorizonMask, azimuthDeg: number): number {
  const n = mask.length
  const step = 360 / n
  const x = (normalizeAzimuth(azimuthDeg) / step)
  const i = Math.floor(x)
  const f = x - i
  return mask[i % n] * (1 - f) + mask[(i + 1) % n] * f
}

/** Fraction of a body's disc above the skyline, linear across the disc. */
export function discFractionAbove(elevationDeg: number, angularRadiusDeg: number, horizonDeg: number): number {
  const f = (elevationDeg + angularRadiusDeg - horizonDeg) / (2 * angularRadiusDeg)
  return Math.max(0, Math.min(1, f))
}

export const maskToParam = (mask: HorizonMask) => mask.map((v) => Math.round(v * 10) / 10).join(',')
export const maskIsFlat = (mask: HorizonMask) => mask.every((v) => v === 0)

export function parseMaskParam(value: string | null): HorizonMask | null {
  if (!value) return null
  const parts = value.split(',').map(Number)
  if (parts.length !== 16 || parts.some((v) => !Number.isFinite(v) || v < -30 || v > 90)) return null
  return parts
}

/**
 * Parses a horizon profile of "azimuth, elevation" lines into 16 sectors by
 * circular linear interpolation.
 */
export function parseHorizonProfile(text: string): { mask: HorizonMask } | { error: string } {
  const rows = text
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
  if (rows.length < 4) return { error: 'Add at least 4 rows of azimuth and horizon elevation.' }
  const pairs: [number, number][] = []
  for (const row of rows) {
    const [azRaw, elRaw] = row.split(/[,;\t ]+/)
    const az = Number(azRaw)
    const el = Number(elRaw)
    if (!Number.isFinite(az) || !Number.isFinite(el)) {
      return { error: `Row "${row}" is not two numbers. Expected azimuth, horizon elevation.` }
    }
    if (az < 0 || az > 360) return { error: `Azimuth ${az} is outside 0 to 360.` }
    if (el < -30 || el > 90) return { error: `Horizon elevation ${el} is outside -30 to 90.` }
    pairs.push([az, el])
  }
  pairs.sort((a, b) => a[0] - b[0])
  const mask: HorizonMask = []
  for (let i = 0; i < 16; i += 1) {
    const target = (i * 360) / 16
    let value = pairs[0][1]
    for (let k = 0; k < pairs.length; k += 1) {
      const [az, el] = pairs[k]
      const next = pairs[(k + 1) % pairs.length]
      const span = k === pairs.length - 1 ? next[0] + 360 - az : next[0] - az
      const offset = (((target - az) % 360) + 360) % 360
      if (span > 0 && offset <= span) {
        const t = offset / span
        value = el * (1 - t) + next[1] * t
      }
    }
    mask.push(Math.round(value * 100) / 100)
  }
  return { mask }
}
