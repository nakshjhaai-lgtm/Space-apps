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

const worstRows = (rows: Row[], n = 3) =>
  [...rows].sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual)).slice(0, n)

const groupOrder: [keyof typeof report.groups, Row[], number][] = [
  ['sunLat', sunLat, tol.sunLat],
  ['sunLon', sunLon, tol.sunLon],
  ['obsLat', obsLat, tol.obsLat],
  ['obsLon', obsLon, tol.obsLon],
  ['elev', elev, tol.elev],
  ['az', az, tol.az],
]

const table = groupOrder
  .map(([key, rows, limit]) => {
    const g = report.groups[key]
    return `| ${g.label} | ${rows.length} | ${g.max.toFixed(4)} | ${g.rms.toFixed(4)} | ${limit} | ${g.max <= limit ? 'pass' : 'fail'} |`
  })
  .join('\n')

const worst = groupOrder
  .map(([key, rows]) => {
    const g = report.groups[key]
    return `### ${g.label}\n\n| Reference instant | Horizons value | Selenorizon value | Residual |\n| --- | --- | --- | --- |\n${worstRows(rows)
      .map(
        (r) =>
          `| ${r.utc} | ${r.reference.toFixed(4)} | ${r.value.toFixed(4)} | ${r.residual >= 0 ? '+' : ''}${r.residual.toFixed(4)} |`,
      )
      .join('\n')}`
  })
  .join('\n\n')

const markdown = `# Validation against JPL Horizons

Generated ${report.generated} by \`node --experimental-strip-types scripts/validate.ts\`.
The same run writes \`validation/residuals.json\`, which the model screen reads at runtime, so the numbers on the
website are the numbers in this report.

## What was compared

Six independent quantities, each a vector subtraction between a JPL Horizons value and the value Selenorizon
computes for the same instant:

1. **Sub-solar latitude and longitude** - the point on the lunar surface with the Sun overhead, from the Moon
   apparent-orbit table in the Moon-fixed frame (\`horizons-epochs.json\`, ${epochs.rows.length} instants across a synodic month).
2. **Sub-Earth latitude and longitude** - the libration point, same file, same instants.
3. **Site elevation and azimuth** - apparent topocentric horizontal coordinates of the Sun and of Earth from
   three real surface points (\`horizons-site.json\`, ${sites.sites.reduce((n: number, x: { rows: unknown[] }) => n + x.rows.length, 0)} rows).
   These include the observer-surface parallax, so they are the quantities the app actually plans with.

All angles are in degrees. Longitude residuals are wrapped to the range -180 to 180 before scoring.

## Results

| Quantity | Points | Max residual (deg) | RMS (deg) | Tolerance (deg) | Status |
| --- | --- | --- | --- | --- | --- |
${table}

The tolerance is not a comfortable round number. At the south pole the Sun never climbs higher than about two
degrees, so a 0.02 degree elevation error is roughly one percent of the whole signal; a planner that was off by
half a degree would get ridge occlusion wrong for hours at a time. Azimuth is looser because it is multiplied by
the cosine of a small elevation before it can affect visibility.

## Worst residuals

${worst}

## Reproduction

\`\`\`bash
npm run verify
\`\`\`

\`verify\` runs the type checker, the test suite, this residual report, and the production build. The report exits
non-zero if any group leaves tolerance, so a regression fails the build rather than shipping quietly.

## What this establishes, and what it does not

**Establishes.** The solar and lunar position series, the IAU 2009 lunar rotation, and the site-to-body geometry
agree with JPL Horizons to well inside the tolerance above, at the sites the catalogue uses, over 2026 and 2027.

**Does not establish.** Anything about terrain. Real skyline profiles come from LOLA digital elevation models and
are not shipped with this repository; the app takes a skyline as an input and says so on every screen that uses
one. See \`docs/DATA-SOURCES.md\` for what a real deployment would load, and \`docs/SCIENCE.md\` for the model
that would consume it.
`
writeFileSync(join(root, 'docs/validation.md'), markdown)

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
