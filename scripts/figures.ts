import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { jdeFromMs } from '../src/engine/time.ts'
import { lunarGeometry, angularRadiusDeg, EARTH_RADIUS_KM } from '../src/engine/geometry.ts'
import { horizonAt, type HorizonMask } from '../src/engine/site.ts'
import { sampleSite, summarize } from '../src/engine/planner.ts'
import { SITES, siteById } from '../src/engine/sites.ts'

const root = join(import.meta.dirname, '..')
const outDir = join(root, 'docs/figures')
mkdirSync(outDir, { recursive: true })

const DARK = { paper: '#1d1915', ground: '#3a342d', rule: '#4d453b', muted: '#a2988a', ink: '#f2ece3', accent: '#e8b33c', earth: '#7fa8c9' }
const EL_MIN = -12
const EL_MAX = 12
const W = 1200
const H = 520
const PAD = { left: 56, right: 24, top: 34, bottom: 44 }

const x = (az: number) => PAD.left + (az / 360) * (W - PAD.left - PAD.right)
const y = (el: number) => PAD.top + ((EL_MAX - el) / (EL_MAX - EL_MIN)) * (H - PAD.top - PAD.bottom)

interface TrackPoint {
  azimuth: number
  elevation: number
}

function polyline(points: TrackPoint[], color: string, dash = '') {
  let d = ''
  let started = false
  let previous: number | null = null
  for (const p of points) {
    const px = x(p.azimuth).toFixed(1)
    const py = y(Math.max(EL_MIN, Math.min(EL_MAX, p.elevation))).toFixed(1)
    if (previous !== null && Math.abs(p.azimuth - previous) > 180) started = false
    d += `${started ? 'L' : 'M'}${px},${py} `
    started = true
    previous = p.azimuth
  }
  return `<path d="${d.trim()}" fill="none" stroke="${color}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`
}

function horizonPath(mask: HorizonMask) {
  let d = `M${x(0).toFixed(1)},${(H - PAD.bottom).toFixed(1)} `
  for (let az = 0; az <= 360; az += 1) {
    d += `L${x(az).toFixed(1)},${y(Math.max(EL_MIN, Math.min(EL_MAX, horizonAt(mask, az)))).toFixed(1)} `
  }
  d += `L${x(360).toFixed(1)},${(H - PAD.bottom).toFixed(1)} Z`
  return d
}

function panel(title: string, mask: HorizonMask, sunTrack: TrackPoint[], earthTrack: TrackPoint[], sun: TrackPoint, earth: TrackPoint, sunBlocked: boolean, earthBlocked: boolean) {
  const ticks = [-10, -5, 0, 5, 10]
    .map(
      (el) =>
        `<line x1="${PAD.left}" x2="${W - PAD.right}" y1="${y(el).toFixed(1)}" y2="${y(el).toFixed(1)}" stroke="${el === 0 ? DARK.rule : '#3a342d'}" stroke-width="1"/>` +
        `<text x="${PAD.left - 10}" y="${(y(el) + 4).toFixed(1)}" fill="${DARK.muted}" font-family="monospace" font-size="13" text-anchor="end">${el > 0 ? '+' : ''}${el}°</text>`,
    )
    .join('')
  const azimuthTicks = [0, 45, 90, 135, 180, 225, 270, 315, 360]
    .map(
      (az) =>
        `<line x1="${x(az).toFixed(1)}" x2="${x(az).toFixed(1)}" y1="${PAD.top}" y2="${H - PAD.bottom}" stroke="#3a342d" stroke-width="1"/>` +
        `<text x="${x(az).toFixed(1)}" y="${H - PAD.bottom + 22}" fill="${DARK.muted}" font-family="monospace" font-size="13" text-anchor="middle">${az}°</text>`,
    )
    .join('')

  const marker = (point: TrackPoint, color: string, label: string, blocked: boolean) => {
    const cx = x(point.azimuth)
    const cy = y(Math.max(EL_MIN, Math.min(EL_MAX, point.elevation)))
    const text = blocked ? `${label} occluded` : label
    return `<g><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="8" fill="${blocked ? DARK.paper : color}" stroke="${blocked ? '#e0736a' : color}" stroke-width="2.4"/>${
      blocked
        ? `<path d="M${(cx - 5).toFixed(1)},${(cy - 5).toFixed(1)} L${(cx + 5).toFixed(1)},${(cy + 5).toFixed(1)} M${(cx + 5).toFixed(1)},${(cy - 5).toFixed(1)} L${(cx - 5).toFixed(1)},${(cy + 5).toFixed(1)}" stroke="#e0736a" stroke-width="1.8"/>`
        : ''
    }<text x="${(cx + 14).toFixed(1)}" y="${(cy - 10).toFixed(1)}" fill="${blocked ? '#e0736a' : DARK.ink}" font-family="sans-serif" font-size="15">${text}</text></g>`
  }

  return `<g>
    <text x="${PAD.left}" y="24" fill="${DARK.ink}" font-family="sans-serif" font-size="17">${title}</text>
    ${ticks}${azimuthTicks}
    <path d="${horizonPath(mask)}" fill="${DARK.ground}" stroke="${DARK.muted}" stroke-width="1.6"/>
    ${polyline(earthTrack, DARK.earth, '5 5')}
    ${polyline(sunTrack, DARK.accent)}
    ${marker(earth, DARK.earth, 'Earth', earthBlocked)}
    ${marker(sun, DARK.accent, 'Sun', sunBlocked)}
  </g>`
}

function svg(body: string, width = W, height = H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${DARK.paper}"/>
    ${body}
  </svg>`
}

const startMs = Date.parse('2026-12-20T00:00:00Z')
const site = siteById('connecting-ridge')
const flat: HorizonMask = new Array(16).fill(0)
const ridge: HorizonMask = [1.6, 2.4, 2.6, 2.2, 1.8, 1.4, 0.6, 0.4, 0.3, 0.5, 0.4, 0.3, 0.4, 0.6, 0.9, 1.2]

function tracksFor(mask: HorizonMask) {
  const samples = sampleSite(site, { startMs, endMs: startMs + 30 * 86_400_000, stepMinutes: 180, commFloorDeg: 5, mask })
  return {
    sunTrack: samples.map((s) => ({ azimuth: s.sun.azimuth, elevation: s.sun.elevation })),
    earthTrack: samples.map((s) => ({ azimuth: s.earth.azimuth, elevation: s.earth.elevation })),
    sun: { azimuth: samples[0].sun.azimuth, elevation: samples[0].sun.elevation },
    earth: { azimuth: samples[0].earth.azimuth, elevation: samples[0].earth.elevation },
    sunBlocked: !samples[0].sunVisible,
    earthBlocked: !samples[0].earthVisible,
    summary: summarize(samples, 15),
  }
}

const withFlat = tracksFor(flat)
const withRidge = tracksFor(ridge)

const figureOne = svg(
  `${panel('Flat reference: no terrain', flat, withFlat.sunTrack, withFlat.earthTrack, withFlat.sun, withFlat.earth, withFlat.sunBlocked, withFlat.earthBlocked)}
   <g transform="translate(0,${H})">${panel('Loaded profile: a 2.6 degree ridge', ridge, withRidge.sunTrack, withRidge.earthTrack, withRidge.sun, withRidge.earth, withRidge.sunBlocked, withRidge.earthBlocked)}</g>`,
  W,
  H * 2,
)

// comparison figure
const cache = new Map<number, ReturnType<typeof lunarGeometry>>()
const rows = SITES.map((entry) => {
  const samples = sampleSite(entry, { startMs, endMs: startMs + 30 * 86_400_000, stepMinutes: 60, commFloorDeg: 5, mask: flat }, cache)
  return { name: entry.name, summary: summarize(samples, 60) }
}).sort((a, b) => b.summary.scores - a.summary.scores)

const barW = 760
const rowH = 46
const compareHeight = rows.length * rowH + 110
const bars = rows
  .map((row, index) => {
    const yTop = 70 + index * rowH
    const sunlit = (row.summary.sunlitPct / 100) * barW
    const comm = (row.summary.commPct / 100) * barW
    return `<g>
      <text x="24" y="${yTop + 16}" fill="${DARK.ink}" font-family="sans-serif" font-size="15">${row.name}</text>
      <rect x="330" y="${yTop}" width="${barW}" height="11" fill="#2b2620"/>
      <rect x="330" y="${yTop}" width="${sunlit.toFixed(1)}" height="11" fill="${DARK.accent}"/>
      <rect x="330" y="${yTop + 16}" width="${barW}" height="11" fill="#2b2620"/>
      <rect x="330" y="${yTop + 16}" width="${comm.toFixed(1)}" height="11" fill="${DARK.earth}"/>
      <text x="${330 + barW + 14}" y="${yTop + 10}" fill="${DARK.muted}" font-family="monospace" font-size="13">${row.summary.sunlitPct.toFixed(0)}%</text>
      <text x="${330 + barW + 14}" y="${yTop + 26}" fill="${DARK.muted}" font-family="monospace" font-size="13">${row.summary.commPct.toFixed(0)}%</text>
      <text x="24" y="${yTop + 28}" fill="${DARK.muted}" font-family="monospace" font-size="12">score ${row.summary.scores.toFixed(1)}, worst gap ${row.summary.longestCommGapHours.toFixed(0)} h</text>
    </g>`
  })
  .join('')

const figureTwo = svg(
  `<text x="24" y="34" fill="${DARK.ink}" font-family="sans-serif" font-size="17">Sunlit share (amber) and Earth-visible share (blue), 30 days from 1 December 2026, flat reference</text>
   ${bars}
   <text x="24" y="${compareHeight - 22}" fill="${DARK.muted}" font-family="monospace" font-size="12">Hourly samples, comm floor 5 degrees, horizon flat. Selenorizon.</text>`,
  1120,
  compareHeight,
)

const figures: [string, string][] = [
  ['horizon-flat-vs-ridge', figureOne],
  ['comparison-30-days', figureTwo],
]

for (const [name, markup] of figures) {
  writeFileSync(join(outDir, `${name}.svg`), markup)
  await sharp(Buffer.from(markup), { density: 144 })
    .png()
    .toFile(join(outDir, `${name}.png`))
  console.log(`wrote docs/figures/${name}.svg and .png`)
}

const flatSummary = withFlat.summary
const ridgeSummary = withRidge.summary
writeFileSync(
  join(outDir, 'figure-notes.md'),
  `# Figure notes

Generated by \`npm run figures\` from the same engine functions the application calls.
Site: ${site.name}, ${site.latDeg.toFixed(5)} south latitude, ${site.lonDeg.toFixed(5)} east longitude.
Instant: 2026-12-20T00:00Z, tracks over one lunar day at 3 hour steps.

| Mask | Sunlit over one lunar day | Earth visible | Sun elevation at t0 | Earth elevation at t0 |
| --- | --- | --- | --- | --- |
| Flat reference | ${flatSummary.sunlitPct.toFixed(1)}% | ${flatSummary.commPct.toFixed(1)}% | ${withFlat.sun.elevation.toFixed(2)} deg | ${withFlat.earth.elevation.toFixed(2)} deg |
| Loaded 2.6 deg ridge | ${ridgeSummary.sunlitPct.toFixed(1)}% | ${ridgeSummary.commPct.toFixed(1)}% | ${withRidge.sun.elevation.toFixed(2)} deg | ${withRidge.earth.elevation.toFixed(2)} deg |

The Earth disc angular radius at this instant is ${angularRadiusDeg(EARTH_RADIUS_KM, lunarGeometry(jdeFromMs(startMs)).earthRangeKm).toFixed(3)} degrees.
`,
)
console.log('wrote docs/figures/figure-notes.md')
