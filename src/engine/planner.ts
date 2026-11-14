import { angularRadiusDeg, EARTH_RADIUS_KM, lunarGeometry, SUN_ANGULAR_RADIUS_DEG, type LunarGeometry } from './geometry.ts'
import { horizonAt, localFrame, skyPosition, type HorizonMask, type SkyPosition } from './site.ts'
import { jdeFromMs } from './time.ts'
import type { Site } from './sites.ts'

export interface SkySample {
  ms: number
  sun: SkyPosition
  earth: SkyPosition
  sunHorizon: number
  earthHorizon: number
  sunDisc: number
  earthDisc: number
  sunVisible: boolean
  earthVisible: boolean
}

export interface WindowRange {
  startMs: number
  endMs: number
  hours: number
}

export interface Summary {
  sunlitPct: number
  commPct: number
  bothPct: number
  longestNightHours: number
  longestCommGapHours: number
  insolationIndex: number
  sunWindows: WindowRange[]
  commWindows: WindowRange[]
  windowHours: number
  scores: number
}

/** Composite planning score. Weights are published in the interface and in docs/SCIENCE.md. */
export function windowScore(
  s: Pick<Summary, 'sunlitPct' | 'commPct' | 'bothPct' | 'longestCommGapHours'> & { windowHours: number },
): number {
  // the gap is measured against the window it came from, so an eighteen day silence cannot score like half a day
  const penalty = 20 * Math.min(1, s.longestCommGapHours / Math.max(1, s.windowHours))
  return 0.45 * s.sunlitPct + 0.35 * s.commPct + 0.2 * s.bothPct - penalty
}

export interface SampleOptions {
  startMs: number
  endMs: number
  stepMinutes: number
  commFloorDeg: number
  mask: HorizonMask
}

/**
 * Samples one site over a window. Geometry is evaluated once per timestamp and
 * shared by every site on the same grid.
 */
export function sampleSite(site: Site, opts: SampleOptions, geometryCache?: Map<number, LunarGeometry>): SkySample[] {
  const frame = localFrame(site.lonDeg, site.latDeg)
  const stepMs = opts.stepMinutes * 60_000
  const out: SkySample[] = []
  for (let ms = opts.startMs; ms <= opts.endMs; ms += stepMs) {
    const bucket = Math.round(ms / 60_000) * 60_000
    let g = geometryCache?.get(bucket)
    if (!g) {
      g = lunarGeometry(jdeFromMs(ms))
      geometryCache?.set(bucket, g)
    }
    const sun = skyPosition(g.sunBodyKm, frame)
    const earth = skyPosition(g.earthBodyKm, frame)
    const sunHorizon = horizonAt(opts.mask, sun.azimuth)
    const earthHorizon = horizonAt(opts.mask, earth.azimuth)
    const earthRadius = angularRadiusDeg(EARTH_RADIUS_KM, g.earthRangeKm)
    out.push({
      ms,
      sun,
      earth,
      sunHorizon,
      earthHorizon,
      sunDisc: Math.max(0, Math.min(1, (sun.elevation + SUN_ANGULAR_RADIUS_DEG - sunHorizon) / (2 * SUN_ANGULAR_RADIUS_DEG))),
      earthDisc: Math.max(0, Math.min(1, (earth.elevation + earthRadius - earthHorizon) / (2 * earthRadius))),
      sunVisible: sun.elevation > sunHorizon,
      earthVisible: earth.elevation > Math.max(earthHorizon, opts.commFloorDeg),
    })
  }
  return out
}

export function runsOf(samples: SkySample[], key: 'sunVisible' | 'earthVisible', stepMinutes: number): WindowRange[] {
  const runs: WindowRange[] = []
  let start: number | null = null
  for (const s of samples) {
    if (s[key] && start === null) start = s.ms
    if (!s[key] && start !== null) {
      runs.push({ startMs: start, endMs: s.ms, hours: (s.ms - start) / 3_600_000 })
      start = null
    }
  }
  if (start !== null) {
    const last = samples[samples.length - 1]
    runs.push({ startMs: start, endMs: last.ms + stepMinutes * 60_000, hours: (last.ms + stepMinutes * 60_000 - start) / 3_600_000 })
  }
  return runs
}

export function longestGapHours(samples: SkySample[], key: 'sunVisible' | 'earthVisible', stepMinutes: number): number {
  let worst = 0
  let run = 0
  for (const s of samples) {
    if (!s[key]) {
      run += stepMinutes / 60
      worst = Math.max(worst, run)
    } else run = 0
  }
  return worst
}

export function summarize(samples: SkySample[], stepMinutes: number): Summary {
  const n = samples.length || 1
  const sunlit = samples.filter((s) => s.sunVisible).length
  const comm = samples.filter((s) => s.earthVisible).length
  const both = samples.filter((s) => s.sunVisible && s.earthVisible).length
  const summary: Summary = {
    sunlitPct: (100 * sunlit) / n,
    commPct: (100 * comm) / n,
    bothPct: (100 * both) / n,
    longestNightHours: longestGapHours(samples, 'sunVisible', stepMinutes),
    longestCommGapHours: longestGapHours(samples, 'earthVisible', stepMinutes),
    insolationIndex: samples.reduce((acc, s) => acc + Math.max(0, Math.sin((s.sun.elevation * Math.PI) / 180)), 0) / n,
    sunWindows: runsOf(samples, 'sunVisible', stepMinutes),
    commWindows: runsOf(samples, 'earthVisible', stepMinutes),
    windowHours: n * (stepMinutes / 60),
    scores: 0,
  }
  summary.scores = windowScore(summary)
  return summary
}

export interface LandingDate {
  startMs: number
  summary: Summary
}

/** Ranks candidate landing dates for one site over the next `nights` days each. */
export function rankLandingDates(
  site: Site,
  fromMs: number,
  toMs: number,
  nights: number,
  commFloorDeg: number,
  mask: HorizonMask,
  stepMinutes = 120,
): LandingDate[] {
  const cache = new Map<number, LunarGeometry>()
  const out: LandingDate[] = []
  for (let ms = fromMs; ms <= toMs; ms += 86_400_000) {
    const samples = sampleSite(site, {
      startMs: ms,
      endMs: ms + nights * 86_400_000,
      stepMinutes,
      commFloorDeg,
      mask,
    }, cache)
    out.push({ startMs: ms, summary: summarize(samples, stepMinutes) })
  }
  return out.sort((a, b) => b.summary.scores - a.summary.scores)
}
