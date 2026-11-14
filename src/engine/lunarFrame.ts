import { cross, dot, fromSpherical, unit, type V3 } from './vec.ts'
import { daysSinceJ2000, centuriesSinceJ2000 } from './time.ts'

const D2R = Math.PI / 180

/** IAU lunar rotation model (WGCCRE report): pole and prime meridian, degrees. */
function iauAngles(jde: number) {
  const d = daysSinceJ2000(jde)
  const T = centuriesSinceJ2000(jde)
  const E1 = (125.045 - 0.0529921 * d) * D2R
  const E2 = (250.089 - 0.1059842 * d) * D2R
  const E3 = (260.008 + 13.0120009 * d) * D2R
  const E4 = (176.625 + 13.3407154 * d) * D2R
  const E5 = (357.529 + 0.9856003 * d) * D2R
  const E6 = (311.589 + 26.4057084 * d) * D2R
  const E7 = (134.963 + 13.064993 * d) * D2R
  const E8 = (276.617 + 0.3287146 * d) * D2R
  const E9 = (34.226 + 1.7484877 * d) * D2R
  const E10 = (15.134 - 0.1589763 * d) * D2R
  const E11 = (119.743 + 0.0036096 * d) * D2R
  const E12 = (239.961 + 0.1643573 * d) * D2R
  const E13 = (25.053 + 12.9590088 * d) * D2R
  const s = Math.sin, c = Math.cos

  const ra = 269.9949 + 0.0031 * T
    - 3.8787 * s(E1) - 0.1204 * s(E2) + 0.0700 * s(E3) - 0.0172 * s(E4)
    + 0.0072 * s(E6) - 0.0052 * s(E10) + 0.0043 * s(E13)
  const dec = 66.5392 + 0.0130 * T
    + 1.5419 * c(E1) + 0.0239 * c(E2) - 0.0278 * c(E3) + 0.0068 * c(E4)
    - 0.0029 * c(E6) + 0.0009 * c(E7) + 0.0008 * c(E8) - 0.0009 * c(E10)
    + 0.0003 * c(E13)
  const W = 38.3213 + 13.17635815 * d - 1.4e-12 * d * d
    + 3.5610 * s(E1) + 0.1208 * s(E2) - 0.0642 * s(E3) + 0.0158 * s(E4)
    + 0.0252 * s(E5) - 0.0066 * s(E6) - 0.0047 * s(E7) - 0.0046 * s(E8)
    + 0.0028 * s(E9) + 0.0052 * s(E10) + 0.0040 * s(E11) + 0.0019 * s(E12)
    - 0.0044 * s(E13)

  return { ra: ra * D2R, dec: dec * D2R, w: W * D2R }
}

export interface LunarAxes {
  /** Body +X: prime meridian on the equator, J2000 equatorial frame. */
  x: V3
  /** Body +Y: 90 degrees east, J2000 equatorial frame. */
  y: V3
  /** Body +Z: rotation axis. */
  z: V3
}

export function lunarAxes(jde: number): LunarAxes {
  const { ra, dec, w } = iauAngles(jde)
  const z = fromSpherical(ra, dec)
  const node = unit(cross([0, 0, 1], z))
  const x = unit([
    Math.cos(w) * node[0] + Math.sin(w) * cross(z, node)[0],
    Math.cos(w) * node[1] + Math.sin(w) * cross(z, node)[1],
    Math.cos(w) * node[2] + Math.sin(w) * cross(z, node)[2],
  ])
  return { x, y: cross(z, x), z }
}

export interface SubPoint {
  /** Selenographic longitude, degrees, east positive. */
  lonDeg: number
  /** Selenographic latitude, degrees. */
  latDeg: number
}

/** Selenographic sub-point of a direction given in the J2000 equatorial frame. */
export function subPoint(direction: V3, axes: LunarAxes): SubPoint {
  const dir = unit(direction)
  return {
    lonDeg: Math.atan2(dot(dir, axes.y), dot(dir, axes.x)) / D2R,
    latDeg: Math.asin(Math.max(-1, Math.min(1, dot(dir, axes.z)))) / D2R,
  }
}

/** Unit vector for a selenographic coordinate (east positive) in the body frame. */
export const selenographicToBody = (lonDeg: number, latDeg: number): V3 =>
  fromSpherical(lonDeg * D2R, latDeg * D2R)
