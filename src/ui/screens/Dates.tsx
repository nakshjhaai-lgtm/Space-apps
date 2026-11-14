import { useMemo } from 'react'
import { PageHead, Panel, Note } from '../components/primitives.tsx'
import { SortableTable, type Column } from '../components/Table.tsx'
import { useLocation, setQuery, navigate } from '../router.ts'
import { SITES, siteById } from '../../engine/sites.ts'
import { FLAT_HORIZON, parseMaskParam } from '../../engine/site.ts'
import { rankLandingDates, type LandingDate } from '../../engine/planner.ts'
import { clampNumber, date, hours, percent, parseDay, isoDay, roundToHour } from '../format.ts'
import { horizonLabel } from '../labels.ts'

const DAY = 86_400_000

export function Dates() {
  const { query } = useLocation()
  const site = siteById(query.get('s'))
  const mask = parseMaskParam(query.get('hz')) ?? FLAT_HORIZON
  const floor = clampNumber(query.get('floor'), 5, 0, 30)
  const nights = clampNumber(query.get('nights'), 7, 3, 30)
  const fromMs = parseDay(query.get('from'), roundToHour(Date.now()))
  const toMs = Math.min(parseDay(query.get('to'), fromMs + 180 * DAY), fromMs + 365 * DAY)

  const ranked = useMemo(
    () => rankLandingDates(site, fromMs, toMs, nights, floor, mask, 120).slice(0, 24),
    [site, fromMs, toMs, nights, floor, mask],
  )

  const columns: Column<LandingDate>[] = [
    {
      key: 'start',
      label: 'Landing date',
      render: (row) => date(row.startMs),
      sortValue: (row) => row.startMs,
    },
    {
      key: 'score',
      label: 'Score',
      numeric: true,
      render: (row) => row.summary.scores.toFixed(1),
      sortValue: (row) => row.summary.scores,
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
      key: 'gap',
      label: 'Longest comm gap',
      numeric: true,
      render: (row) => hours(row.summary.longestCommGapHours),
      sortValue: (row) => row.summary.longestCommGapHours,
    },
    {
      key: 'night',
      label: 'Longest night',
      numeric: true,
      render: (row) => hours(row.summary.longestNightHours),
      sortValue: (row) => row.summary.longestNightHours,
    },
  ]

  return (
    <>
      <PageHead
        title="Which landing date holds the best window"
        lede="Each date is scored over the first days of the surface mission, not on the landing day alone. The ranking uses the same horizon model and communication floor as the rest of the tool."
        meta={
          <>
            <span>{site.name}</span>
            <span>
              {date(fromMs)} to {date(toMs)}
            </span>
            <span>{nights} day surface window</span>
            <span>Horizon: {horizonLabel(mask)}</span>
          </>
        }
      />

      <Panel flush>
        <div className="controls">
          <div className="field">
            <label className="field__label" htmlFor="d-site">Site</label>
            <select id="d-site" value={site.id} onChange={(event) => setQuery({ s: event.target.value })}>
              {SITES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="d-from">Earliest date</label>
            <input
              id="d-from"
              type="date"
              value={isoDay(fromMs)}
              onChange={(event) => setQuery({ from: isoDay(parseDay(event.target.value, fromMs)) })}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="d-to">Latest date</label>
            <input
              id="d-to"
              type="date"
              value={isoDay(toMs)}
              onChange={(event) => setQuery({ to: isoDay(parseDay(event.target.value, toMs)) })}
            />
            <span className="field__hint">Up to one year from the earliest date</span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="d-nights">Surface window</label>
            <input
              id="d-nights"
              type="number"
              min={3}
              max={30}
              step={1}
              value={nights}
              onChange={(event) => setQuery({ nights: String(clampNumber(event.target.value, nights, 3, 30)) })}
            />
            <span className="field__hint">Days scored from each landing date</span>
          </div>
        </div>
      </Panel>

      <Panel title="Top dates" hint="Click a row to open that instant in the horizon view" flush>
        <SortableTable
          columns={columns}
          rows={ranked}
          rowKey={(row) => String(row.startMs)}
          initialSort="score"
          caption={`Candidate landing dates for ${site.name}, scored over ${nights} days each`}
          onRowSelect={(row) => navigate(`/horizon?s=${site.id}&t=${new Date(row.startMs).toISOString().slice(0, 13)}:00`)}
        />
      </Panel>

      <Note>
        <strong>Why the window matters more than the day.</strong> A landing date that opens with perfect light and
        loses Earth on day three is worse than one that starts slightly darker and keeps a link. Each row scores the
        whole window and carries the longest communication gap as a separate column.
      </Note>
    </>
  )
}

