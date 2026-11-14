import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jdeFromMs } from '../src/engine/time.ts'
import { lunarGeometry } from '../src/engine/geometry.ts'
import { localFrame, skyPosition } from '../src/engine/site.ts'

const root = join(import.meta.dirname, '..')
const tol = { sunLat: 0.02, sunLon: 0.05, obsLat: 0.05, obsLon: 0.05, elev: 0.02, az: 0.1 }

const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180

interface Row { utc: string; value: number; reference: number; residual: number }

const epochs = JSON.parse(readFileSync(join(root, 'validation/horizons-epochs.json'), 'utf8'))
const sunLat: Row[] = []
const sunLon: Row[] = []
const obsLat: Row[] = []
const obsLon: Row[] = []

for (const r of epochs.rows) {
  const jde = jdeFromMs(Date.parse(r.utc))
  const g = lunarGeometry(jde)
  sunLat.push({ utc: r.utc, reference: r.sunLat, value: g.sunSub.latDeg, residual: g.sunSub.latDeg - r.sunLat })
  sunLon.push({ utc: r.utc, reference: r.sunLon, value: g.sunSub.lonDeg, residual: wrap(g.sunSub.lonDeg - r.sunLon) })
  obsLat.push({ utc: r.utc, reference: r.obsLat, value: g.earthSub.latDeg, residual: g.earthSub.latDeg - r.obsLat })
  obsLon.push({ utc: r.utc, reference: r.obsLon, value: g.earthSub.lonDeg, residual: wrap(g.earthSub.lonDeg - r.obsLon) })
}

const sites = JSON.parse(readFileSync(join(root, 'validation/horizons-site.json'), 'utf8'))
const elev: Row[] = []
const az: Row[] = []
for (const s of sites.sites) {
  const frame = localFrame(s.lonDeg, s.latDeg)
  for (const r of s.rows) {
    const jde = jdeFromMs(Date.parse(r.utc))
    const g = lunarGeometry(jde)
    const sky = skyPosition(s.body === 'Sun' ? g.sunBodyKm : g.earthBodyKm, frame)
    elev.push({ utc: `${s.id} ${r.utc}`, reference: r.el, value: sky.elevation, residual: sky.elevation - r.el })
    az.push({ utc: `${s.id} ${r.utc}`, reference: r.az, value: sky.azimuth, residual: wrap(sky.azimuth - r.az) })
  }
}

const stats = (rows: Row[]) => {
  const worst = rows.reduce((a, b) => (Math.abs(b.residual) > Math.abs(a.residual) ? b : a))
  const rms = Math.sqrt(rows.reduce((s, r) => s + r.residual * r.residual, 0) / rows.length)
  return { max: Number(Math.abs(worst.residual).toFixed(4)), rms: Number(rms.toFixed(4)), worstAt: worst.utc }
}

const report = {
  generated: new Date().toISOString(),
  toleranceDeg: tol,
  groups: {
    sunLat: { label: 'Sub-solar latitude', ...stats(sunLat) },
    sunLon: { label: 'Sub-solar longitude', ...stats(sunLon) },
    obsLat: { label: 'Sub-Earth latitude', ...stats(obsLat) },
    obsLon: { label: 'Sub-Earth longitude', ...stats(obsLon) },
    elev: { label: 'Site elevation', ...stats(elev) },
    az: { label: 'Site azimuth', ...stats(az) },
  },
  rows: { sunLat, sunLon, obsLat, obsLon, elev, az },
}

writeFileSync(join(root, 'validation/residuals.json'), JSON.stringify(report, null, 2) + '\n')

const limits: [keyof typeof report.groups, number][] = [
  ['sunLat', tol.sunLat], ['sunLon', tol.sunLon], ['obsLat', tol.obsLat],
  ['obsLon', tol.obsLon], ['elev', tol.elev], ['az', tol.az],
]
let failed = 0
console.log('group                 max       rms      tolerance   status')
for (const [key, limit] of limits) {
  const g = report.groups[key]
  const ok = g.max <= limit
  if (!ok) failed += 1
  console.log(
    `${g.label.padEnd(21)} ${String(g.max).padEnd(9)} ${String(g.rms).padEnd(8)} ${String(limit).padEnd(11)} ${ok ? 'pass' : 'FAIL'}`,
  )
}
if (failed > 0) {
  console.error(`\n${failed} group(s) outside tolerance.`)
  process.exit(1)
}
console.log('\nAll groups inside tolerance. Wrote validation/residuals.json')
