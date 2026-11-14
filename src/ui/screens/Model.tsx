import { PageHead, Panel, Note, Disclosure } from '../components/primitives.tsx'
import residuals from '../../../validation/residuals.json'
import { FLAT_HORIZON } from '../../engine/site.ts'

const groups = Object.values(residuals.groups) as {
  label: string
  max: number
  rms: number
  worstAt: string
}[]

export function Model() {
  return (
    <>
      <PageHead
        title="What the numbers are made of"
        lede="Every reading comes from four published pieces: a solar position series, a lunar position series, an IAU rotation model for the Moon, and the site geometry. None of it is fitted to the output. This page states the fits, the residuals against NASA's ephemerides, and what the tool does not measure."
        meta={<span>Residuals generated {residuals.generated.slice(0, 10)} from the committed JPL Horizons snapshots</span>}
      />

      <Panel title="Accuracy against JPL Horizons" hint="DE441, MOON_ME frame, east longitude positive">
        <div className="table-wrap">
          <table className="data">
            <caption>
              {groups.length} measurement groups, {String(Object.keys(residuals.rows).length)} sample sets, largest absolute
              residual in degrees
            </caption>
            <thead>
              <tr>
                <th scope="col">Quantity</th>
                <th scope="col" className="num">Largest residual</th>
                <th scope="col" className="num">RMS</th>
                <th scope="col" className="num">Tolerance</th>
                <th scope="col">Worst sample</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.label}>
                  <td className="name">{group.label}</td>
                  <td className="num">{group.max.toFixed(4)}</td>
                  <td className="num">{group.rms.toFixed(4)}</td>
                  <td className="num">
                    {String((residuals.toleranceDeg as Record<string, number>)[toleranceKey(group.label)] ?? '')}
                  </td>
                  <td>{group.worstAt.replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          The table is written by <code>npm run validate</code> and rendered from the same file. If a residual leaves its
          tolerance the command fails, so this page cannot show a passing table for a failing build. The site elevation
          agreement of 0.002 degrees is the number that matters: it decides whether a body clears the skyline.
        </Note>
      </Panel>

      <div className="split">
        <Panel title="Frames and fits">
          <div className="prose">
            <ul>
              <li>
                <strong>Time.</strong> Julian day from Unix milliseconds, dynamical time offset fixed at 69 seconds,
                worth half a second over 2020 to 2040.
              </li>
              <li>
                <strong>Sun.</strong> Meeus low-precision solar coordinates, geometric, mean equinox of date, error below
                0.01 degrees.
              </li>
              <li>
                <strong>Moon.</strong> Meeus truncated ELP series, sixty periodic terms, via the MIT-licensed astronomia
                library. Reproduces the book's worked example to the printed precision.
              </li>
              <li>
                <strong>Sun direction from the Moon.</strong> Computed as the Sun vector minus the Moon vector. Skipping
                that subtraction would displace the sub-solar point by up to 0.147 degrees.
              </li>
              <li>
                <strong>Lunar orientation.</strong> IAU working group model with thirteen periodic arguments, giving the
                pole and the prime meridian. Selenographic longitude is positive east.
              </li>
              <li>
                <strong>Site geometry.</strong> The observer stands on the surface, so the Earth direction carries a
                parallax of up to 0.26 degrees compared with the Moon's centre. That correction is included.
              </li>
            </ul>
          </div>
        </Panel>

        <Panel title="Metrics and weights">
          <div className="prose">
            <ul>
              <li>Sunlit share: fraction of samples with the Sun's centre above the horizon mask.</li>
              <li>Earth share: fraction above both the mask and the communication elevation floor.</li>
              <li>Both: fraction where the two hold together.</li>
              <li>Longest night and longest communication gap: the longest unbroken run of each.</li>
              <li>
                Score: 0.45 sunlit, plus 0.35 Earth, plus 0.20 both, minus 20 scaled by the longest communication gap
                against 12 hours.
              </li>
              <li>Insolation index: mean of the sine of solar elevation, a proxy for panel output per unit area.</li>
            </ul>
          </div>
        </Panel>
      </div>

      <Panel title="Limits, stated where they bite">
        <div className="prose">
          <ul>
            <li>
              <strong>Terrain comes from you, not from a bundled model.</strong> No elevation model is embedded, so the
              default mask is flat and labelled as such. Import a horizon profile to get the terrain-corrected answer,
              and the label follows the data.
            </li>
            <li>
              <strong>Disc fraction is a linear scan.</strong> The share of a body above the skyline is interpolated
              across the disc, not integrated over the limb.
            </li>
            <li>
              <strong>No hazard, slope, boulder or thermal analysis.</strong> A landable spot in a study is not
              automatically landable for a specific vehicle.
            </li>
            <li>
              <strong>No link budget.</strong> The tool compares elevation against a floor. Antenna pattern, data rate
              and margin are the engineer's job.
            </li>
            <li>
              <strong>No atmospheric refraction, no tides, no nutation beyond precession.</strong> The Moon has no
              atmosphere; the other two are below the tolerances published above.
            </li>
          </ul>
        </div>
      </Panel>

      <Panel title="Questions this tool gets asked">
        <div className="stack" style={{ gap: 'var(--s-2)' }}>
          <Disclosure summary="Why is the default horizon flat?">
            <p>
              Because a skyline the user cannot see is a hidden assumption. A flat mask is the geometric ceiling, and
              the screen prints the words flat reference beside it. Load a profile and every number moves with the
              mask and its label.
            </p>
          </Disclosure>
          <Disclosure summary="Why do two sites in the same region differ?">
            <p>
              A region spans roughly 15 kilometres. Two points inside it can sit on opposite sides of a ridge, and at
              the pole a one degree ridge is the difference between power all month and power half the month.
            </p>
          </Disclosure>
          <Disclosure summary="Is this an official NASA tool?">
            <p>
              No. It is an independent entry for the 2026 NASA Space Apps Challenge. NASA's 2022 region names and
              published coordinates are used with credit; no NASA logo, flag or mission identifier appears here.
            </p>
          </Disclosure>
          <Disclosure summary="Can I use it offline?">
            <p>
              Yes. Every computation runs in your browser, there are no network calls after the page loads, and nothing
              is stored except your theme choice and the view in the URL.
            </p>
          </Disclosure>
          <Disclosure summary="How do I get a real terrain profile?">
            <p>
              Crop the LRO LOLA polar elevation model around your site, compute the maximum elevation angle per
              azimuth, and paste the two-column result into the import box. The exact command is in the repository, in
              the data sources note.
            </p>
          </Disclosure>
        </div>
      </Panel>

      <div className="split">
        <Panel title="Sources">
          <div className="prose">
            <ul>
              <li>
                NASA/JPL Horizons, ephemeris DE441, used as the validation oracle:{' '}
                <a href="https://ssd.jpl.nasa.gov/api/horizons.api" target="_blank" rel="noreferrer noopener">
                  ssd.jpl.nasa.gov
                </a>
              </li>
              <li>
                NASA Artemis III candidate landing regions, 2022 announcement:{' '}
                <a
                  href="https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  nasa.gov
                </a>
              </li>
              <li>
                Candidate coordinates:{' '}
                <a href="https://www.hou.usra.edu/meetings/lpsc2024/pdf/1695.pdf" target="_blank" rel="noreferrer noopener">
                  LPSC 2024 abstract 1695
                </a>
                ,{' '}
                <a href="https://doi.org/10.1029/2025JE009434" target="_blank" rel="noreferrer noopener">
                  Wueller et al. 2026
                </a>
                ,{' '}
                <a href="https://arxiv.org/abs/2406.19863" target="_blank" rel="noreferrer noopener">
                  arXiv:2406.19863
                </a>
              </li>
              <li>Lunar rotation: IAU Working Group on Cartographic Coordinates and Rotational Elements.</li>
              <li>Position series: Meeus, Astronomical Algorithms, via the MIT-licensed astronomia library.</li>
              <li>Terrain, if you supply it: LRO LOLA LDEM_80S_80M, NASA Planetary Data System.</li>
            </ul>
          </div>
        </Panel>

        <Panel title="Privacy and disclosure">
          <div className="prose">
            <p>
              <strong>Privacy.</strong> No accounts, no cookies, no analytics, no third-party requests. Your theme
              choice and the current view live in your browser and in the URL.
            </p>
            <p>
              <strong>Generative assistance.</strong> A large language model assisted with research summarising,
              document drafting, code generation and the demo script. Every constant, series and residual was checked
              against the publications above and against JPL Horizons by the validator in the repository. No imagery in
              this project is generated.
            </p>
            <p>
              <strong>Independence.</strong> This is an independent entry for the 2026 NASA Space Apps Challenge and is
              not endorsed by NASA. Region names are used with credit.
            </p>
          </div>
        </Panel>
      </div>

      <Note>
        <strong>Current horizon mode.</strong>{' '}
        {FLAT_HORIZON.length === 16 ? 'Sixteen azimuth sectors, interpolated linearly between sector centres.' : ''} The
        default is flat; any profile you load is carried in the URL as sixteen values and printed beside every number it
        affects.
      </Note>
    </>
  )
}

function toleranceKey(label: string) {
  switch (label) {
    case 'Sub-solar latitude':
      return 'sunLat'
    case 'Sub-solar longitude':
      return 'sunLon'
    case 'Sub-Earth latitude':
      return 'obsLat'
    case 'Sub-Earth longitude':
      return 'obsLon'
    case 'Site elevation':
      return 'elev'
    default:
      return 'az'
  }
}
