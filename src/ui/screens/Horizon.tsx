import { useMemo, useState } from 'react'
import { PageHead, Panel, Readout, Note, Disclosure } from '../components/primitives.tsx'
import { Panorama } from '../components/Panorama.tsx'
import { SectorEditor, Strip } from '../components/HorizonControls.tsx'
import { useLocation, setQuery } from '../router.ts'
import { SITES, siteById, formatLatitude, formatLongitude } from '../../engine/sites.ts'
import {
  FLAT_HORIZON,
  maskToParam,
  parseHorizonProfile,
  parseMaskParam,
  type HorizonMask,
} from '../../engine/site.ts'
import { sampleSite, summarize } from '../../engine/planner.ts'
import { clampNumber, degrees, hours, percent, instant, isoInstant, parseInstant, roundToHour, isoDay } from '../format.ts'
import { horizonLabel } from '../labels.ts'

const HOURS_24 = 86_400_000

export function Horizon() {
  const { query } = useLocation()
  const site = siteById(query.get('s'))
  const mask = parseMaskParam(query.get('hz')) ?? FLAT_HORIZON
  const floor = clampNumber(query.get('floor'), 5, 0, 30)
  const instantMs = parseInstant(query.get('t'), roundToHour(Date.now()))
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  const day = useMemo(
    () =>
      sampleSite(site, {
        startMs: instantMs,
        endMs: instantMs + HOURS_24,
        stepMinutes: 10,
        commFloorDeg: floor,
        mask,
      }),
    [site, instantMs, floor, mask],
  )

  const month = useMemo(
    () =>
      sampleSite(site, {
        startMs: instantMs,
        endMs: instantMs + 30 * HOURS_24,
        stepMinutes: 360,
        commFloorDeg: floor,
        mask,
      }),
    [site, instantMs, floor, mask],
  )

  const current = day[0]
  const monthSummary = summarize(month, 360)
  const sunUp = current.sunVisible
  const earthUp = current.earthVisible

  const setMask = (next: HorizonMask) => setQuery({ hz: maskToParam(next) })

  const exportSeries = () => {
    const header = 'utc,sun_elevation_deg,sun_azimuth_deg,sun_horizon_deg,earth_elevation_deg,earth_azimuth_deg,earth_horizon_deg,sun_visible,earth_visible\n'
    const rows = day
      .map((s) =>
        [
          new Date(s.ms).toISOString(),
          s.sun.elevation.toFixed(3),
          s.sun.azimuth.toFixed(2),
          s.sunHorizon.toFixed(2),
          s.earth.elevation.toFixed(3),
          s.earth.azimuth.toFixed(2),
          s.earthHorizon.toFixed(2),
          s.sunVisible,
          s.earthVisible,
        ].join(','),
      )
      .join('\n')
    download(`selenorizon-${site.id}-${isoDay(instantMs)}.csv`, header + rows)
  }

  return (
    <>
      <PageHead
        title="Where the Sun and Earth sit against the skyline"
        lede="The band is the local skyline across 360 degrees of azimuth. The Sun searches once around it per lunar day, about 29.5 Earth days; Earth swings through a narrow libration loop. A marker inside the band has no direct view of that body."
        meta={
          <>
            <span>{site.name}</span>
            <span>Horizon: {horizonLabel(mask)}</span>
            <span>Comm floor {floor.toFixed(0)} degrees</span>
            <span>{instant(instantMs)}</span>
          </>
        }
      />

      <Panel flush>
        <div className="controls">
          <div className="field">
            <label className="field__label" htmlFor="h-site">Site</label>
            <select id="h-site" value={site.id} onChange={(event) => setQuery({ s: event.target.value })}>
              {SITES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            <span className="field__hint">
              {formatLatitude(site.latDeg)}, {formatLongitude(site.lonDeg)}
            </span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="h-instant">Instant</label>
            <input
              id="h-instant"
              type="datetime-local"
              value={isoInstant(instantMs)}
              step={3600}
              onChange={(event) => setQuery({ t: event.target.value })}
            />
            <span className="field__hint">Coordinated Universal Time</span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="h-floor">Comm elevation floor</label>
            <input
              id="h-floor"
              type="number"
              min={0}
              max={30}
              step={1}
              value={floor}
              onChange={(event) => setQuery({ floor: String(clampNumber(event.target.value, floor, 0, 30)) })}
            />
            <span className="field__hint">Degrees; below this Earth is treated as unusable</span>
          </div>
          <div className="field">
            <span className="field__label" id="h-mode-label">Horizon model</span>
            <div className="segmented" role="group" aria-labelledby="h-mode-label">
              <label>
                <input
                  type="radio"
                  name="horizon"
                  checked={mask.every((v) => v === 0)}
                  onChange={() => setMask(FLAT_HORIZON)}
                />
                <span>Flat</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="horizon"
                  checked={!mask.every((v) => v === 0)}
                  onChange={() => setMask([0.5, 0.5, 1, 1, 1.5, 1.5, 1, 0.5, 0.5, 1, 1.5, 2, 2, 1.5, 1, 0.5])}
                />
                <span>Edited</span>
              </label>
            </div>
            <span className="field__hint">Flat is the geometric ceiling</span>
          </div>
        </div>
      </Panel>

      <div className="split">
        <Panel flush title="Panorama" hint="One lunar day of Sun and Earth motion">
          <Panorama
            sunTrack={month.map((s) => ({ azimuth: s.sun.azimuth, elevation: s.sun.elevation }))}
            earthTrack={month.map((s) => ({ azimuth: s.earth.azimuth, elevation: s.earth.elevation }))}
            sun={{ azimuth: current.sun.azimuth, elevation: current.sun.elevation, blocked: !sunUp }}
            earth={{ azimuth: current.earth.azimuth, elevation: current.earth.elevation, blocked: !earthUp }}
            mask={mask}
            caption={`Skyline at ${site.name} with the Sun at ${degrees(current.sun.elevation)} and Earth at ${degrees(
              current.earth.elevation,
            )}, ${sunUp ? 'Sun clear of terrain' : 'Sun behind terrain'}, ${
              earthUp ? 'Earth clear' : 'Earth not usable'
            }.`}
          />
          <div className="legend">
            <span className="legend__item">
              <span className="legend__swatch" style={{ background: 'var(--accent)' }} aria-hidden="true" />
              Sun marker and one lunar day track
            </span>
            <span className="legend__item">
              <span className="legend__swatch" style={{ background: 'var(--earth)' }} aria-hidden="true" />
              Earth marker and one lunar day track
            </span>
            <span className="legend__item">
              <span className="legend__swatch" style={{ background: 'var(--paper-3)' }} aria-hidden="true" />
              Terrain skyline
            </span>
          </div>
        </Panel>

        <div className="stack">
          <Panel title="Readings at this instant" hint={instant(instantMs)}>
            <div className="readouts">
              <Readout
                label="Sun"
                value={degrees(current.sun.elevation)}
                unit={sunUp ? 'clear' : 'occluded'}
                tone={sunUp ? 'sun' : 'blocked'}
                provenance={`azimuth ${degrees(current.sun.azimuth, 0)}, skyline ${degrees(current.sunHorizon, 1)}`}
              />
              <Readout
                label="Earth"
                value={degrees(current.earth.elevation)}
                unit={earthUp ? 'usable' : 'not usable'}
                tone={earthUp ? 'earth' : 'blocked'}
                provenance={`azimuth ${degrees(current.earth.azimuth, 0)}, skyline ${degrees(current.earthHorizon, 1)}`}
              />
              <Readout
                label="Sun disc above skyline"
                value={percent(current.sunDisc)}
                provenance="linear scan across the disc"
              />
              <Readout
                label="Earth disc above skyline"
                value={percent(current.earthDisc)}
                provenance="linear scan across the disc"
              />
            </div>
          </Panel>

          <Panel title="Terrain horizon" hint={horizonLabel(mask)}>
            <SectorEditor mask={mask} onChange={setMask} />
            <Disclosure summary="Import a horizon profile from a DEM">
              <p>
                Two columns per row: azimuth in degrees, then horizon elevation in degrees. The tool resamples to
                sixteen sectors and carries the profile into every number on this screen.
              </p>
              <div className="field">
                <label className="field__label" htmlFor="h-profile">Profile</label>
                <textarea
                  id="h-profile"
                  value={importText}
                  placeholder={'0, 1.2\n45, 0.8\n90, 2.4\n135, 1.1'}
                  onChange={(event) => {
                    setImportText(event.target.value)
                    setImportError(null)
                  }}
                />
              </div>
              {importError ? <p className="field__error">{importError}</p> : null}
              <div className="actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const result = parseHorizonProfile(importText)
                    if ('error' in result) {
                      setImportError(result.error)
                      return
                    }
                    setMask(result.mask)
                    setImportError(null)
                  }}
                >
                  Apply profile
                </button>
                <button type="button" className="btn btn--quiet" onClick={() => setMask(FLAT_HORIZON)}>
                  Back to flat reference
                </button>
              </div>
            </Disclosure>
          </Panel>
        </div>
      </div>

      <Panel title="Thirty days from this instant" hint={`30 day sunlit ${percent(monthSummary.sunlitPct / 100)}, Earth visible ${percent(monthSummary.commPct / 100)}`}>
        <Strip
          cells={month.map((s) => ({
            ms: s.ms,
            state: s.sunVisible && s.earthVisible ? 'both' : s.sunVisible ? 'power' : s.earthVisible ? 'comm' : 'none',
          }))}
          onPick={(ms) => setQuery({ t: isoInstant(ms) })}
        />
        <div className="readouts" style={{ marginTop: 'var(--s-4)' }}>
          <Readout label="Longest night" value={hours(monthSummary.longestNightHours)} provenance="this 30 day window" />
          <Readout label="Longest gap without Earth" value={hours(monthSummary.longestCommGapHours)} provenance="this 30 day window" />
          <Readout label="Both available" value={percent(monthSummary.bothPct / 100)} provenance="power and comms together" />
          <Readout label="Window score" value={monthSummary.scores.toFixed(1)} provenance="weights on the model screen" />
        </div>
        <Note>
          <strong>What this window does not include.</strong> The Sun's highest point here is {degrees(Math.max(...day.map((s) => s.sun.elevation)))}.
          Terrain is only what the mask says: switch the model above and the numbers move with it.
        </Note>
        <div className="actions">
          <button type="button" className="btn" onClick={exportSeries}>
            Export this day as CSV
          </button>
          <button type="button" className="btn btn--quiet" onClick={() => copyLink()}>
            Copy link to this view
          </button>
        </div>
      </Panel>

      <Panel title="Hourly readings" hint="The table behind the panorama" flush>
        <div className="table-wrap">
          <table className="data">
            <caption>Next 24 hours at {site.name}, horizon {horizonLabel(mask)}</caption>
            <thead>
              <tr>
                <th scope="col">UTC</th>
                <th scope="col" className="num">Sun elevation</th>
                <th scope="col" className="num">Sun azimuth</th>
                <th scope="col" className="num">Skyline</th>
                <th scope="col" className="num">Earth elevation</th>
                <th scope="col" className="num">Skyline</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {day
                .filter((_, index) => index % 6 === 0)
                .map((s) => (
                  <tr key={s.ms}>
                    <td>{instant(s.ms)}</td>
                    <td className="num">{degrees(s.sun.elevation)}</td>
                    <td className="num">{degrees(s.sun.azimuth, 0)}</td>
                    <td className="num">{degrees(s.sunHorizon, 1)}</td>
                    <td className="num">{degrees(s.earth.elevation)}</td>
                    <td className="num">{degrees(s.earthHorizon, 1)}</td>
                    <td>
                      {s.sunVisible ? 'power' : 'dark'}
                      {s.earthVisible ? ', comms' : ', no comms'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}


function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function copyLink() {
  navigator.clipboard?.writeText(window.location.href)
}
