# Challenge research and selection

Fourteen official challenges ran for the 2026 event. This note records the screen, the filter, the scoring, and why one challenge was locked.

Filter applied first, as requested: difficulty **Advanced**, and research-heavy rather than art-led. Four challenges survive that filter: Be An Earth System Trend Detective, Dancing with the SARs, Planet X and SPHEREx, Flame in Freefall, plus three that list Advanced alongside Intermediate: Harmonization of MODIS and VIIRS Hot Spots, Field Shift, Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars, Lunar Landing Site Navigator.

## Scoring method

Each challenge scored 1 to 5 on six axes. Data reachability is weighted highest because this build environment can only reach GitHub, npm and PyPI; NASA data portals, NAIF, Earthdata and arbitrary release-asset hosts are blocked. A challenge whose science depends on downloading a raster at build time cannot be validated tonight.

| Axis | Weight | Meaning |
| --- | --- | --- |
| Data reachability | 0.30 | can the required data be obtained and verified from here |
| Verifiability | 0.25 | is there an independent oracle that can falsify the result |
| Differentiation | 0.15 | is there room to be clearly better than the public field |
| Fit to Advanced | 0.15 | does the challenge demand real physics or analysis |
| Crowding (inverse) | 0.10 | how many public repos already occupy the space |
| Delivery risk | 0.05 | chance of an unfinished submission |

## Result

| Challenge | Reach | Verif | Diff | Advanced | Crowd | Risk | Weighted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Lunar Landing Site Navigator** | 5 | 5 | 4 | 5 | 3 | 4 | **4.60** |
| Be An Earth System Trend Detective | 2 | 3 | 4 | 5 | 4 | 2 | 3.05 |
| Harmonization of MODIS and VIIRS Hot Spots | 2 | 3 | 3 | 4 | 4 | 2 | 2.80 |
| Planet X and SPHEREx | 1 | 2 | 4 | 5 | 3 | 2 | 2.35 |
| Flame in Freefall | 2 | 2 | 3 | 4 | 3 | 3 | 2.60 |
| Dancing with the SARs | 1 | 2 | 4 | 5 | 4 | 1 | 2.15 |
| Field Shift | 1 | 3 | 3 | 4 | 3 | 1 | 2.20 |
| Moon and Mars analogue locations | 2 | 2 | 3 | 4 | 4 | 2 | 2.55 |
| Martian Map | 1 | 2 | 3 | 3 | 3 | 2 | 2.10 |
| Health monitoring software | 4 | 2 | 2 | 3 | 2 | 4 | 2.95 |
| Junior Astronaut Mission Trainer | 4 | 2 | 2 | 2 | 2 | 4 | 2.70 |
| Space Mission Design Game | 5 | 3 | 2 | 2 | 2 | 4 | 3.05 |
| Earth Information Jukebox | 4 | 2 | 4 | 2 | 3 | 3 | 3.05 |
| Abandoned but not Forgotten | 5 | 1 | 2 | 1 | 4 | 4 | 3.05 |

## Why the lunar navigator wins

1. **The oracle is free and reachable.** JPL Horizons answers over HTTP with sub-arcsecond truth for exactly the quantities this challenge needs: sub-solar and sub-observer selenographic coordinates, and topocentric azimuth and elevation from a user-defined point on the Moon. A submission that publishes its residuals can prove it is right, which is the Validity criterion.
2. **The physics is closed-form, so it runs anywhere.** Sun position, the Moon's position series, and the IAU lunar rotation model are three hundred lines of arithmetic. No API key, no pre-downloaded raster, no server. The tool works offline and demos instantly, which removes the most common failure mode of a hackathon entry.
3. **Terrain is the honest gap, and it can be made a feature.** No DEM is reachable from this environment. Instead of faking a skyline, the tool takes the horizon profile as a first-class, inspectable, importable input and states plainly which mask produced the number.
4. **The decision is concrete.** Which of the published candidate regions, on which date, with which worst-case comm gap. That is the form of answer a mission planner wants and a judge can check.
5. **Crowding is real but beatable.** Four public repositories target this challenge: a three.js mockup with a toy ephemeris, a small fixed site list, a four-region tool with a bundled DEM pipeline, and a navigator built around precomputed Horizons tables. The first three cannot be audited for accuracy from their own pages; the fourth is auditable and is the standard to beat. Differentiation therefore has to come from an inspectable terrain model, a live engine with published residuals, and a comparison output, which is what this build ships.

## Rejected alternatives, with the reason

- **Be An Earth System Trend Detective.** The whole point is variable selection and significance testing over GES DISC series. With Earthdata blocked there is no honest way to demonstrate significance on real series tonight.
- **Dancing with the SARs.** Requires authenticated ASF or NISAR products. Nothing to show without them.
- **Planet X and SPHEREx.** Needs image cutouts from IRSA. Blocked.
- **Harmonization of MODIS and VIIRS.** FIRMS needs an API key; a shipped sample would be too small to show harmonisation.
- **Flame in Freefall.** Asks for an SI-powered summariser, which means an LLM key at run time. Also a research-corpus task, not a computation.
- **Space Mission Design Game and Junior Astronaut Trainer.** Feasible, but the value is design and balance work rather than verifiable science, and the Advanced filter excludes them.
- **Earth Information Jukebox.** Strong creativity play, weak data path: the visual frames sit behind a blocked host.

## Sources

- Challenge list and difficulty labels: spaceappschallenge.org/2026/challenges
- Judging criteria and submission format: Space Apps 2026 project submission guidance, participant discussion thread `nasa/spaceapps#2123`, and 2026 event listings
- Public repositories working the same challenge, reviewed for gaps: `pythonhack000/lunar-navigator`, `RicardoArg23/MoonSet`, `ziyadell/Lunar-Landing-Site-Navigator`, `nitrimandylis/space-apps-mockup`
- Artemis III candidate region names and published candidate point coordinates: NASA 2022 region release; LPSC 2024 abstract 1695; Wueller et al. 2026, JGR Planets; arXiv:2406.19863
