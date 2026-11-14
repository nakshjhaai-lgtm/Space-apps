# Project page copy

Paste-ready text for the Space Apps project submission form. Keep the form's language English throughout.

## Title

Selenorizon

## Subtitle (one line)

A south-pole window planner: which candidate landing region, on which date, and when the Sun and Earth clear the ridge.

## Challenge

Lunar Landing Site Navigator (Advanced, 2026).

## Elevator pitch (one sentence for the card)

Pick a south-polar site and a date; see the local skyline, when the Sun clears it for power, and when Earth clears it for a direct radio link, ranked across eight published candidate regions.

## What it does

A crewed lander at the lunar south pole is decided by two numbers per hour. Both the Sun and the Earth sit within a few degrees of the horizon, so a ridge a few hundred metres high decides whether a site has power and whether it has a radio link. Selenorizon turns that into one screen.

- Horizon view. A 360 degree skyline for the chosen site, with the Sun and Earth tracks over a lunar day. Each body prints its elevation, its azimuth, the horizon at that azimuth, and its clearance above the ridge, with the word `occluded` when terrain blocks it.
- Comparison. Eight published south-polar sites over one window: sunlit share, Earth-visible share, both, longest night, longest communication gap, and a published composite score. Sort on any column.
- Landing-window scan. Rank the dates in a range for one site, with the worst communication gap as a tie-breaker.
- Terrain you can inspect. The horizon is a named, editable, importable array of sixteen sector values. The screen always states which model produced the numbers: flat reference, edited, or imported profile.
- Export and share. Every control lives in the URL, so a link reproduces the view. The comparison exports as CSV.

## How it addresses the challenge

The challenge asks for an intuitive tool that lets mission planners, educators and the public compare landing sites and dates quickly, with Sun and Earth positions shown against the horizon, to assess power generation and direct-to-Earth communication windows. Selenorizon answers exactly those four questions in one place, with the horizon made explicit rather than hidden, and with the geometry validated against NASA/JPL ephemerides.

## Validity: what was checked, and how

The engine computes solar position, lunar position, the lunar rotation model and site geometry in the browser.

- Validated against the NASA/JPL Horizons system (DE441) at 13 epochs from 2026 to 2028 for sub-solar and sub-Earth selenographic coordinates, and against Horizons topocentric azimuth and elevation at two published sites. Residuals are committed in `validation/` and rendered on the Model screen, not hand copied.
- Measured agreement: sub-solar latitude within [RESIDUAL-SUNLAT] degrees, sub-solar longitude within [RESIDUAL-SUNLON], site elevation within [RESIDUAL-ELEV], site azimuth within [RESIDUAL-AZ].
- The lunar position series reproduces the published worked example to the printed precision (longitude 133.162655 degrees, latitude -3.229126 degrees, distance 368409.7 km).
- No number in the interface is synthetic. Where a model has a limit, the interface says so at the point of use.

## Relevance: what a planner gets

- A ranked shortlist in one screen instead of three tools.
- The ability to put a real terrain horizon under the numbers, and to see the difference between the flat reference and the masked result.
- Shareable links for review, and CSV for a trade study.

## Creativity

- Terrain as a first-class, inspectable input rather than a hidden assumption or a decorative 3D scene. The tool shows the geometric ceiling and the masked reality side by side, which is the actual planning conversation.
- The whole computation runs client-side from published series: no key, no server, no pre-downloaded raster, instant response on a laptop in the field.
- A provenance line on every readout, so the number carries its own assumptions.

## Impact

Any Artemis-era surface power or communication study at the south pole does this comparison early. Selenorizon shortens the loop to seconds and makes the terrain assumption visible, which is where studies most often go wrong. It also gives educators a ten-second answer to "why is the south pole hard", and gives the public a tool that needs no explanation.

## Data sources and credits

- NASA/JPL Horizons system, ephemeris DE441, for validation truth: ssd.jpl.nasa.gov/api/horizons.api
- NASA Artemis III candidate landing regions, announcement of 13 regions, August 2022: nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/
- Published candidate coordinates: LPSC 2024 abstract 1695; Wueller et al. 2026, JGR Planets, doi:10.1029/2025JE009434; arXiv:2406.19863
- Lunar rotation: IAU Working Group on Cartographic Coordinates and Rotational Elements
- Position series: Meeus, Astronomical Algorithms, 2nd edition, implemented by the MIT-licensed `astronomia` library
- LRO LOLA polar DEM (`LDEM_80S_80M`) and NASA SVS CGI Moon Kit are documented as the sources for deriving an imported horizon profile

Full list with licences: `docs/DATA-SOURCES.md`.

## Tools and SI disclosure

Built with React, Vite and TypeScript. Generative assistance (a large language model through Arena.ai) was used for research summarising, document drafting, and code generation, and for drafting the demo script. Every scientific constant, series and residual was checked against the cited publications and against JPL Horizons output by the validator in this repository. No imagery is AI-generated. No NASA logo, flag or mission identifier appears anywhere in the project.

## Links

- Live application: [LIVE-URL]
- Source: github.com/nakshjhaai-lgtm/Space-apps
- Demo video, 30 seconds: [VIDEO-URL]

## Judging criteria, in the order the guidance lists them

| Criterion | Evidence in this entry |
| --- | --- |
| Impact | the earliest and most repeated trade study for any south-polar surface mission, reduced from hours to seconds, with the terrain assumption exposed |
| Creativity | terrain as an inspectable array with a provenance line on every reading; client-side engine with published residuals; flat-reference versus masked comparison as a first-class view |
| Validity | JPL Horizons residuals committed and rendered; worked example reproduced; stated limits at the point of use; no synthetic data |
| Relevance | answers the challenge's four questions directly, for planners, educators and the public, on eight NASA-named regions |
| Presentation | five screens, one decision each, keyboard reachable, shareable links, 30 second demo, seven slide deck |
