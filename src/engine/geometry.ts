import { eclipticOfDateToICRF, moonEcliptic, sunEcliptic } from './ephemeris.ts'
import { lunarAxes, subPoint, type SubPoint } from './lunarFrame.ts'
import { centuriesSinceJ2000 } from './time.ts'
import { dot, unit, type V3 } from './vec.ts'

export const MOON_RADIUS_KM = 1737.4

export interface LunarGeometry {
  /** Sub-solar point seen from the Moon's centre, used for display. */
  sunSub: SubPoint
  /** Sub-Earth point, which is the libration point. */
  earthSub: SubPoint
  /** Sun position relative to the Moon's centre, km, in the Moon-fixed frame. */
  sunBodyKm: V3
  /** Earth position relative to the Moon's centre, km, in the Moon-fixed frame. */
  earthBodyKm: V3
  /** Earth centre distance from the Moon centre, km. */
  earthRangeKm: number
}

/** Sun and Earth geometry for one instant, in the Moon-fixed frame. */
export function lunarGeometry(jde: number): LunarGeometry {
  const T = centuriesSinceJ2000(jde)
  const moon = moonEcliptic(jde)
  const sun = sunEcliptic(jde)
  const moonVec = eclipticOfDateToICRF(moon.lon, moon.lat, T).map((c) => c * moon.rangeKm) as unknown as V3
  const sunVec = eclipticOfDateToICRF(sun.lon, 0, T).map((c) => c * sun.rangeKm) as unknown as V3
  const sunFromMoon: V3 = [sunVec[0] - moonVec[0], sunVec[1] - moonVec[1], sunVec[2] - moonVec[2]]
  const earthFromMoon: V3 = [-moonVec[0], -moonVec[1], -moonVec[2]]
  const axes = lunarAxes(jde)
  const toBody = (v: V3): V3 => [dot(v, axes.x), dot(v, axes.y), dot(v, axes.z)]
  return {
    sunSub: subPoint(sunFromMoon, axes),
    earthSub: subPoint(earthFromMoon, axes),
    sunBodyKm: toBody(sunFromMoon),
    earthBodyKm: toBody(earthFromMoon),
    earthRangeKm: moon.rangeKm,
  }
}

/** Angular radius of a body of the given physical radius at the given distance. */
export const angularRadiusDeg = (radiusKm: number, distanceKm: number) =>
  (Math.asin(Math.min(1, radiusKm / distanceKm)) * 180) / Math.PI

export const SUN_ANGULAR_RADIUS_DEG = 0.266
export const EARTH_RADIUS_KM = 6378.137

/** Unit direction from a surface point to a body, given the body vector from the Moon's centre. */
export function directionFromSite(bodyVecKm: V3, up: V3): V3 {
  const site: V3 = [up[0] * MOON_RADIUS_KM, up[1] * MOON_RADIUS_KM, up[2] * MOON_RADIUS_KM]
  return unit([bodyVecKm[0] - site[0], bodyVecKm[1] - site[1], bodyVecKm[2] - site[2]])
}
