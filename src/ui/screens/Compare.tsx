import { useMemo } from 'react'
import { PageHead, Panel, Note } from '../components/primitives.tsx'
import { SortableTable, type Column } from '../components/Table.tsx'
import { useLocation, setQuery, navigate } from '../router.ts'
import { SITES, siteById } from '../../engine/sites.ts'
import { FLAT_HORIZON, parseMaskParam } from '../../engine/site.ts'
import { sampleSite, summarize, type Summary } from '../../engine/planner.ts'
import { lunarGeometry } from '../../engine/geometry.ts'
import { clampNumber, date, hours, percent, parseDay, isoDay, roundToHour } from '../format.ts'
import { horizonLabel } from '../labels.ts'

interface Row {
  id: string
  name: string
  region: string
  lat: number
  lon: number
  summary: Summary
}

const HOURS_24 = 86_400_000

export function Compare() {
  const { query } = useLocation()
  const site = siteById(query.get('s'))
  const mask = parseMaskParam(query.get('hz')) ?? FLAT_HORIZON
  const floor = clampNumber(query.get('floor'), 5, 0, 30)
  const days = clampNumber(query.get('d'), 30, 7, 90)
  const startMs = parseDay(query.get('t'), roundToHour(Date.now()))

  const rows = useMemo(() => {
    const cache = new Map<number, ReturnType<typeof lunarGeometry>>()
    return SITES.map((entry) => {
      const samples = sampleSite(
        entry,
        { startMs, endMs: startMs + days * HOURS_24, stepMinutes: 30, commFloorDeg: floor, mask },
        cache,
      )
      return {
        id: entry.id,
        name: entry.name,
        region: entry.region,
        lat: entry.latDeg,
        lon: entry.lonDeg,
        summary: summarize(samples, 30),
      }
    })
  }, [startMs, days, floor, mask])

  const columns: Column<Row>[] = [
    {
      key: 'name',
      label: 'Site',
      render: (row) => <span>{row.name}</span>,
      sortValue: (row) => row.name,
    },
    {
      key: 'sunlit',
      label: 'Sunlit',
      numeric: true,
      render: (row) => percent(row.summary.sunlitPct / 100),
      sortValue: (row) => row.summary.sunlitPct,
    },
    {
      key: 'comm',
      label: 'Earth',
      numeric: true,
      render: (row) => percent(row.summary.commPct / 100),
      sortValue: (row) => row.summary.commPct,
    },
    {
      key: 'both',
      label: 'Both',
      numeric: true,
      render: (row) => percent(row.summary.bothPct / 100),
      sortValue: (row) => row.summary.bothPct,
    },
    {
      key: 'night',
      label: 'Longest night',
      numeric: true,
      render: (row) => hours(row.summary.longestNightHours),
      sortValue: (row) => row.summary.longestNightHours,
    },
    {
      key: 'gap',
      label: 'Longest comm gap',
      numeric: true,
      render: (row) => hours(row.summary.longestCommGapHours),
      sortValue: (row) => row.summary.longestCommGapHours,
    },
    {
      key: 'score',
      label: 'Score',
      numeric: true,
      render: (row) => row.summary.scores.toFixed(1),
      sortValue: (row) => row.summary.scores,
    },
  ]

  const exportCsv = () => {
    const header = 'site,region,south_latitude,east_longitude,sunlit_pct,earth_pct,both_pct,longest_night_h,longest_comm_gap_h,score\n'
    const body = rows
      .map((row) =>
        [
          `"${row.name}"`,
          `"${row.region}"`,
          row.lat.toFixed(5),
          row.lon.toFixed(5),
          row.summary.sunlitPct.toFixed(1),
          row.summary.commPct.toFixed(1),
          row.summary.bothPct.toFixed(1),
          row.summary.longestNightHours.toFixed(1),
          row.summary.longestCommGapHours.toFixed(1),
          row.summary.scores.toFixed(1),
        ].join(','),
      )
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `selenorizon-compare-${isoDay(startMs)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHead
        title="Eight published sites, one window, ranked"
        lede="Every site in the catalogue, measured over the same window with the same horizon model. Sorting is on the numbers, not on a suitability claim. Click a row to open its horizon view."
        meta={
          <>
            <span>
              {days} days from {date(startMs)}
            </span>
            <span>30 minute steps</span>
            <span>Horizon: {horizonLabel(mask)}</span>
            <span>Comm floor {floor} degrees</span>
          </>
        }
      />

      <Panel flush>
        <div className="controls">
          <div className="field">
            <label className="field__label" htmlFor="c-start">Start date</label>
            <input
              id="c-start"
              type="date"
              value={isoDay(startMs)}
              onChange={(event) => {
                const next = parseDay(event.target.value, startMs)
                setQuery({ t: isoDay(next) })
              }}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="c-window">Window</label>
            <select id="c-window" value={days} onChange={(event) => setQuery({ d: event.target.value })}>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="c-floor">Comm elevation floor</label>
            <input
              id="c-floor"
              type="number"
              min={0}
              max={30}
              step={1}
              value={floor}
              onChange={(event) => setQuery({ floor: String(clampNumber(event.target.value, floor, 0, 30)) })}
            />
            <span className="field__hint">Degrees above the skyline</span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="c-site">Site for the horizon view</label>
            <select id="c-site" value={site.id} onChange={(event) => setQuery({ s: event.target.value })}>
              {SITES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            <span className="field__hint">Used when you open a horizon view</span>
          </div>
        </div>
      </Panel>

      <Panel title="Ranked comparison" hint="Click a row to open its horizon view" flush>
        <SortableTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          initialSort="score"
          caption={`Sunlit share, Earth visibility, and the worst gap, over ${days} days from ${date(startMs)} with a ${horizonLabel(mask)}`}
          selectedKey={site.id}
          onRowSelect={(row) => navigate(`/horizon?s=${row.id}`)}
        />
        <div className="actions" style={{ marginTop: 'var(--s-4)' }}>
          <button type="button" className="btn" onClick={exportCsv}>
            Export comparison as CSV
          </button>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            Copy link to this view
          </button>
        </div>
      </Panel>

      <Note>
        <strong>How to read the score.</strong> 0.45 times the sunlit share, plus 0.35 times the Earth-visible share,
        plus 0.20 times the share where both hold, minus 20 points scaled by the longest communication gap against 12
        hours. A site that averages well but goes dark for a day loses. The score is a planning aid, not a NASA figure.
      </Note>

      {mask.every((v) => v === 0) ? (
        <Note warn>
          <strong>Flat horizon in force.</strong> These numbers are the geometric ceiling at each site: no ridge blocks
          anything. Set a profile in the horizon view and it carries into this table.
        </Note>
      ) : null}
    </>
  )
}

