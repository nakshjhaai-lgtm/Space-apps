export type V3 = readonly [number, number, number]

export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

export const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

export const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]

export const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2])
  return [a[0] / l, a[1] / l, a[2] / l]
}

/** Unit vector from spherical coordinates. `lon` is measured in the XY plane. */
export const fromSpherical = (lonRad: number, latRad: number): V3 => {
  const c = Math.cos(latRad)
  return [c * Math.cos(lonRad), c * Math.sin(lonRad), Math.sin(latRad)]
}
