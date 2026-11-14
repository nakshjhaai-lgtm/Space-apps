# Selenorizon

A south-pole window planner for the lunar surface. Pick a candidate landing region and a date, and see the local skyline, when the Sun clears it for power, and when Earth clears it for a direct-to-Earth radio link. Built for the NASA Space Apps Challenge 2026 challenge **Lunar Landing Site Navigator**.

Not an official NASA product. Region names follow NASA's published 2022 announcement; coordinates follow the published papers cited below.

## Why it exists

At the lunar south pole the Sun never climbs more than about 1.5 degrees above the horizon, and Earth stays inside about 8 degrees of it. A ridge a few hundred metres high decides whether a site has power and whether it has a radio link at all. Planning therefore needs one thing: a fast, honest comparison of sites and dates against the skyline. This tool is that comparison, with the skyline treated as an input you can inspect rather than an assumption buried in the code.

## What it does

- **Horizon view** for one site: 360 degree skyline, Sun and Earth tracks over a lunar day, elevation, azimuth, horizon at that azimuth, clearance, and an explicit `occluded` state.
- **Comparison** of eight published south-polar sites over one window: sunlit share, Earth-visible share, both, longest night, longest communication gap, composite score. Sortable, exportable as CSV.
- **Date scan** for one site: candidate landing dates ranked, with the worst communication gap as a tie-breaker.
- **Terrain as an input**: a flat reference, a 16-sector editor, or an imported horizon profile CSV. The active model is named on screen.
- **Shareable state**: every control lives in the URL.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # ephemeris residuals against the committed JPL Horizons snapshots
npm run verify     # typecheck, unit tests, validation thresholds, build
```

## How the science is checked

The engine is independent: it computes the Sun, the Moon, the lunar rotation and the site geometry from published series in the browser.

| Check | Oracle | Result |
| --- | --- | --- |
| Sub-solar and sub-Earth selenographic coordinates, 13 epochs 2026 to 2028 | NASA/JPL Horizons, DE441 | see `docs/validation.md` |
| Topocentric Sun and Earth elevation and azimuth at two published sites | NASA/JPL Horizons, DE441 | see `docs/validation.md` |
| Lunar position series against the book's worked example | Meeus, example 47.a | longitude 133.162655 degrees, latitude -3.229126 degrees, distance 368409.7 km, reproduced to printed precision |

`npm run validate` writes `validation/residuals.json`, which the Model screen renders. If a residual leaves the tolerance stated in `docs/SCIENCE.md`, the command exits non-zero and the build fails.

## Repository map

```
docs/           PRD, research, science specification, data sources, architecture, UX, build plan,
                submission copy, video script, deck, anti-slop coverage matrix, validation report
src/engine/     pure computation: time, ephemeris, lunar frame, geometry, site, planner, catalogue
src/ui/         shell, routes, components, tokens
scripts/        validate.ts (residuals), figures.ts (documentation figures), horizon_from_dem.py
validation/     committed JPL Horizons snapshots and the generated residuals
```

## Deploy

Static output, no server, no environment variables.

```bash
npm run build
# Netlify
NETLIFY_AUTH_TOKEN=<your token> npx netlify-cli deploy --prod --dir=dist
# or drag dist/ into the Netlify dashboard, or serve it from any static host
```

`netlify.toml` carries the SPA rewrite, cache policy and security headers. Note: the build environment used to author this repository could not reach `api.netlify.com`, so the deploy is a one-command step left to the operator.

## Data and credits

Full list with licences in `docs/DATA-SOURCES.md`. The essentials:

- NASA/JPL Horizons, DE441, for validation truth.
- NASA Artemis III candidate landing regions, 2022 announcement.
- Candidate coordinates: LPSC 2024 abstract 1695; Wueller et al. 2026, JGR Planets; arXiv:2406.19863.
- Lunar rotation: IAU Working Group on Cartographic Coordinates and Rotational Elements.
- Position series: Meeus, *Astronomical Algorithms*, via the MIT-licensed `astronomia` library.
- LRO LOLA `LDEM_80S_80M` and the NASA SVS CGI Moon Kit are documented as the source for deriving an imported horizon profile.

## Limits, stated plainly

No hazard detection, no slope or boulder analysis, no permanently shadowed region mapping, no link budget, no antenna model, no thermal model, no trajectory work. The horizon profile is the hand-off point from a digital elevation model, and the derivation command is documented rather than hidden. Every limit is repeated on the Model screen where it affects a number.

## SI disclosure

Generative assistance was used for research summarising, document drafting, code generation and the demo script. Every scientific constant, series and residual was verified against the published references and against JPL Horizons by the validator in this repository. No imagery is AI-generated. No NASA logo, flag or mission identifier is used. Details in `docs/DATA-SOURCES.md` section 3.

## Licence

MIT for the code. Fonts under the SIL Open Font License. Cited data remains under its own terms.
