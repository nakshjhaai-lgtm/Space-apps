import { base, moonposition, solar } from 'astronomia'
import { centuriesSinceJ2000 } from './time.ts'
import type { V3 } from './vec.ts'

const D2R = Math.PI / 180
export const ARCSEC = D2R / 3600

export interface EclipticPosition {
  /** Geocentric ecliptic longitude, radians, mean equinox of date. */
  lon: number
  /** Geocentric ecliptic latitude, radians, mean equinox of date. */
  lat: number
  /** Distance in kilometres. */
  rangeKm: number
}

const AU_KM = 149_597_870.7

/** Geometric geocentric position of the Sun, mean equinox of date (Meeus ch. 25). */
export function sunEcliptic(jde: number): EclipticPosition {
  const T = centuriesSinceJ2000(jde)
  const { lon } = solar.trueLongitude(T)
  return { lon, lat: 0, rangeKm: solar.radius(T) * AU_KM }
}

/** Geocentric position of the Moon, mean equinox of date (Meeus ch. 47, full series). */
export function moonEcliptic(jde: number): EclipticPosition {
  const p = moonposition.position(jde)
  return { lon: base.pmod(p.lon, 2 * Math.PI), lat: p.lat, rangeKm: p.range }
}

/** Mean obliquity of the ecliptic of date, radians. */
export function obliquity(T: number): number {
  return (23.43929111 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T) * D2R
}

const rotX = (v: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]
}
const rotY = (v: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]
}
const rotZ = (v: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]
}

/** IAU 1976 precession, date to J2000, applied as the exact inverse rotation (Meeus ch. 21). */
function precessDateToJ2000(v: V3, T: number): V3 {
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) * ARCSEC
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) * ARCSEC
  const theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T) * ARCSEC
  return rotZ(rotY(rotZ(v, -z), theta), -zeta)
}

/**
 * Direction of an ecliptic-of-date coordinate as a unit vector in the J2000
 * equatorial (ICRF) frame.
 */
export function eclipticOfDateToICRF(lon: number, lat: number, T: number): V3 {
  const c = Math.cos(lat)
  const ecliptic: V3 = [c * Math.cos(lon), c * Math.sin(lon), Math.sin(lat)]
  return precessDateToJ2000(rotX(ecliptic, obliquity(T)), T)
}

export const AU_KM_EXPORT = AU_KM
