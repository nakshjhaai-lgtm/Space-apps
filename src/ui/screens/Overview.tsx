import { useMemo } from 'react'
import { PageHead, Panel, Readout, Note } from '../components/primitives.tsx'
import { useLocation, hrefFor } from '../router.ts'
import { siteById, formatLatitude, formatLongitude } from '../../engine/sites.ts'
import { FLAT_HORIZON, parseMaskParam, localFrame, skyPosition } from '../../engine/site.ts'
import { lunarGeometry, EARTH_RADIUS_KM, angularRadiusDeg } from '../../engine/geometry.ts'
import { sampleSite, summarize } from '../../engine/planner.ts'
import { jdeFromMs } from '../../engine/time.ts'
import { clampNumber, degrees, hours, percent, instant } from '../format.ts'
import { horizonLabel } from '../labels.ts'

const DAY = 86_400_000

export function Overview() {
  const { query } = useLocation()
  const site = siteById(query.get('s'))
  const mask = parseMaskParam(query.get('hz')) ?? FLAT_HORIZON
  const floor = clampNumber(query.get('floor'), 5, 0, 30)
  const now = useMemo(() => Math.round(Date.now() / 3_600_000) * 3_600_000, [])

  const reading = useMemo(() => {
    const geometry = lunarGeometry(jdeFromMs(now))
    const frame = localFrame(site.lonDeg, site.latDeg)
    const sun = skyPosition(geometry.sunBodyKm, frame)
    const earth = skyPosition(geometry.earthBodyKm, frame)
    const samples = sampleSite(site, {
      startMs: now,
      endMs: now + 30 * DAY,
      stepMinutes: 60,
      commFloorDeg: floor,
      mask,
    })
    const current = samples[0]
    return {
      sun,
      earth,
      sunHorizon: current.sunHorizon,
      earthHorizon: current.earthHorizon,
      sunUp: current.sunVisible,
      earthUp: current.earthVisible,
      earthRadius: angularRadiusDeg(EARTH_RADIUS_KM, geometry.earthRangeKm),
      lunarDay: summarize(samples, 60),
      maxSunElevation: Math.max(...samples.map((s) => s.sun.elevation)),
    }
  }, [now, site, mask, floor])

  return (
    <>
      <PageHead
        title="When the Sun and Earth clear the ridge"
        lede="A south-pole landing site lives on two numbers per hour: how much sunlight reaches it, and whether Earth is above the horizon for a direct radio link. Both bodies stay within a few degrees of the skyline, so the local terrain decides the result. This tool puts those numbers side by side for eight published candidate sites."
        meta={
          <>
            <span>
              Site {site.name}, {formatLatitude(site.latDeg)}, {formatLongitude(site.lonDeg)}
            </span>
            <span>Horizon: {horizonLabel(mask)}</span>
            <span>Reading for {instant(now)}</span>
          </>
        }
      />

      <Panel title="Reading at this site now" hint="Geometry from the Sun and Moon positions at this instant">
        <div className="readouts">
          <Readout
            label="Sun elevation"
            value={degrees(reading.sun.elevation)}
            tone={reading.sunUp ? 'sun' : 'blocked'}
            provenance={`skyline ${degrees(reading.sunHorizon, 1)} at this azimuth`}
          />
          <Readout
            label="Sun azimuth"
            value={degrees(reading.sun.azimuth, 0)}
            provenance="clockwise from local north"
          />
          <Readout
            label="Earth elevation"
            value={degrees(reading.earth.elevation)}
            tone={reading.earthUp ? 'earth' : 'blocked'}
            provenance={`skyline ${degrees(reading.earthHorizon, 1)}, floor ${degrees(floor, 0)}`}
          />
          <Readout
            label="Earth disc above horizon"
            value={percent(
              Math.max(0, Math.min(1, (reading.earth.elevation + reading.earthRadius - reading.earthHorizon) / (2 * reading.earthRadius))),
              0,
            )}
            provenance={`angular radius ${degrees(reading.earthRadius, 2)}`}
          />
          <Readout
            label="Sunlit over the next lunar day"
            value={percent(reading.lunarDay.sunlitPct / 100, 0)}
            provenance={`horizon model: ${horizonLabel(mask)}`}
          />
          <Readout
            label="Earth visible over the next lunar day"
            value={percent(reading.lunarDay.commPct / 100, 0)}
            provenance={`above the terrain and the ${degrees(floor, 0)} floor`}
          />
        </div>
        <Note>
          The Sun reaches {degrees(reading.maxSunElevation, 1)} at its highest over the next lunar day, thirty Earth days
          because that is how long the Sun takes to circle the pole. A ridge higher than that removes direct sunlight
          entirely. Set the skyline in the horizon view to see the difference.
        </Note>
      </Panel>

      <div className="actions">
        <a className="btn btn--primary" href={hrefFor('/horizon', { s: site.id })}>
          Open the horizon view
        </a>
        <a className="btn" href={hrefFor('/compare', { s: site.id })}>
          Compare all sites
        </a>
        <a className="btn btn--quiet" href={hrefFor('/model', { s: site.id })}>
          How the numbers are checked
        </a>
      </div>

      <div className="split">
        <Panel title="What the tool measures" hint="Three measurements, one geometry">
          <div className="prose">
            <p>
              <strong>Sun elevation against the skyline.</strong> The Sun's centre sits between about 1.5 degrees below
              and 1.5 degrees above the horizontal through a lunar month at the pole. A skyline above that angle means
              no direct sunlight, and no power from a horizontal array.
            </p>
            <p>
              <strong>Earth elevation against the skyline.</strong> Libration swings Earth plus or minus about 8
              degrees in latitude and longitude. Below a 5 degree floor a low-gain antenna loses the link, and terrain
              can hide Earth while geometry says it is up.
            </p>
            <p>
              <strong>The worst gap, not the average.</strong> A site that is sunlit 80 percent of the time can still
              be dark for four days straight. Both the ranking and the score carry the longest gap explicitly.
            </p>
          </div>
        </Panel>
        <Panel title="How to read a number here" hint="Every reading states its model">
          <div className="prose">
            <p>
              Each value prints where it came from. Elevation and azimuth come from the Sun and Moon position series
              and the lunar rotation model. Visibility adds the horizon mask and the comm floor.
            </p>
            <p>
              When no horizon profile is loaded, the mask is flat and the screen says so. A flat mask is the geometric
              ceiling for that site, not a prediction. Import a horizon profile from a digital elevation model to get
              the terrain-corrected answer, and the label changes with it.
            </p>
          </div>
        </Panel>
      </div>

      <Panel
        title="The next decision"
        hint={`${hours(reading.lunarDay.longestNightHours)} longest night in the next lunar day`}
      >
        <div className="readouts">
          <Readout
            label="Longest dark stretch"
            value={hours(reading.lunarDay.longestNightHours)}
            tone={reading.lunarDay.longestNightHours > 0 ? 'blocked' : 'sun'}
            provenance="next lunar day"
          />
          <Readout
            label="Longest gap without Earth"
            value={hours(reading.lunarDay.longestCommGapHours)}
            tone={reading.earthUp ? 'earth' : 'blocked'}
            provenance={`above the terrain and the ${degrees(floor, 0)} floor`}
          />
          <Readout
            label="Insolation index"
            value={reading.lunarDay.insolationIndex.toFixed(3)}
            provenance="mean of sin elevation, unitless"
          />
          <Readout
            label="Highest skyline sector"
            value={degrees(Math.max(...mask), 1)}
            provenance="from the loaded mask"
          />
        </div>
      </Panel>
    </>
  )
}
