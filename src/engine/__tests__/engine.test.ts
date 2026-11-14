import { describe, expect, it } from 'vitest'
import { jdeFromMs } from '../time.ts'
import { lunarGeometry } from '../geometry.ts'
import { FLAT_HORIZON, horizonAt, localFrame, parseHorizonProfile, parseMaskParam, skyPosition } from '../site.ts'
import { runsOf, summarize, windowScore } from '../planner.ts'
import { siteById } from '../sites.ts'

const ms = (iso: string) => Date.parse(iso)

describe('lunar geometry', () => {
  it('keeps the sub-Earth point inside the libration envelope', () => {
    for (let day = 0; day < 400; day += 7) {
      const g = lunarGeometry(jdeFromMs(ms('2026-01-01T00:00:00Z') + day * 86_400_000))
      expect(Math.abs(g.earthSub.latDeg)).toBeLessThan(8)
      expect(Math.abs(g.earthSub.lonDeg)).toBeLessThan(9)
    }
  })

  it('places the sub-solar point near the lunar equator', () => {
    const g = lunarGeometry(jdeFromMs(ms('2026-12-01T00:00:00Z')))
    expect(Math.abs(g.sunSub.latDeg)).toBeLessThan(2)
    expect(g.earthRangeKm).toBeGreaterThan(350_000)
    expect(g.earthRangeKm).toBeLessThan(410_000)
  })
})

describe('site geometry', () => {
  it('matches the Horizons topocentric elevation at a published site', () => {
    const site = siteById('connecting-ridge')
    const frame = localFrame(site.lonDeg, site.latDeg)
    const g = lunarGeometry(jdeFromMs(ms('2026-12-01T00:00:00Z')))
    const sun = skyPosition(g.sunBodyKm, frame)
    expect(sun.elevation).toBeCloseTo(1.628586, 2)
    expect(sun.azimuth).toBeCloseTo(70.127659, 1)
  })

  it('interpolates the horizon mask between sector centres', () => {
    const mask = new Array(16).fill(0)
    mask[0] = 2
    expect(horizonAt(mask, 0)).toBeCloseTo(2, 5)
    expect(horizonAt(mask, 11.25)).toBeCloseTo(1, 5)
    expect(horizonAt(mask, 22.5)).toBeCloseTo(0, 5)
    expect(horizonAt(mask, 348.75)).toBeCloseTo(1, 5)
  })

  it('rejects a malformed horizon profile and accepts a good one', () => {
    expect('error' in parseHorizonProfile('0, 1\n')).toBe(true)
    const good = parseHorizonProfile('0, 1\n90, 2\n180, 0.5\n270, 1.5')
    expect('mask' in good && good.mask.length === 16).toBe(true)
  })

  it('round-trips a mask through the URL parameter', () => {
    const mask = [0, 0.5, 1, 1.5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const param = mask.map((v) => v.toFixed(1)).join(',')
    expect(parseMaskParam(param)).toEqual(mask)
    expect(parseMaskParam('1,2,3')).toBeNull()
  })
})

describe('window planning', () => {
  const sample = (visible: boolean, ms: number) => ({
    ms,
    sun: { elevation: visible ? 1 : -1, azimuth: 0 },
    earth: { elevation: visible ? 3 : -3, azimuth: 0 },
    sunHorizon: 0,
    earthHorizon: 0,
    sunDisc: visible ? 1 : 0,
    earthDisc: visible ? 1 : 0,
    sunVisible: visible,
    earthVisible: visible,
  })

  it('finds one run and measures its length', () => {
    const samples = [false, false, true, true, true, false].map((v, i) => sample(v, i * 600_000))
    const runs = runsOf(samples, 'sunVisible', 10)
    expect(runs).toHaveLength(1)
    expect(runs[0].hours).toBeCloseTo(0.5, 5)
  })

  it('measures a gap that runs to the end of the window', () => {
    const samples = [true, false, false, false].map((v, i) => sample(v, i * 600_000))
    const summary = summarize(samples, 10)
    expect(summary.longestNightHours).toBeCloseTo(0.5, 5)
    expect(summary.sunlitPct).toBeCloseTo(25, 5)
  })

  it('punishes a long communication gap in the score', () => {
    const base = { sunlitPct: 80, commPct: 80, bothPct: 70, windowHours: 720 }
    const steady = windowScore({ ...base, longestCommGapHours: 2 })
    const brittle = windowScore({ ...base, longestCommGapHours: 360 })
    expect(brittle).toBeLessThan(steady)
    expect(steady - brittle).toBeCloseTo(20 * (0.5 - 2 / 720), 2)
  })

  it('gives a flat mask a zero horizon everywhere', () => {
    expect(FLAT_HORIZON).toHaveLength(16)
    expect(horizonAt(FLAT_HORIZON, 123)).toBe(0)
  })
})
