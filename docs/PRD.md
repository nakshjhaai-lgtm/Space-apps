# PRD — Selenorizon

Product requirements for the NASA Space Apps Challenge 2026 entry.
Status: locked. Any change after this point needs a dated note in this file.

## 1. Event facts that constrain the build

| Fact | Value | Source |
| --- | --- | --- |
| Event | NASA Space Apps Challenge 2026, global hackathon | spaceappschallenge.org/2026 |
| Event dates | 14–15 November 2026 | NASA Space Apps 2026 event listings |
| Submission deadline | 15 November 2026, 11:59 pm participant local time | 2026 participation rules |
| Our local time | IST (UTC+5:30) | session location |
| Judging criteria | Impact, Creativity, Validity, Relevance, Presentation | Space Apps judging guidance |
| Global award buckets | Best Use of Data, Best Use of Science, Best Mission Concept, Galactic Impact, Most Inspirational, and peers | Space Apps awards guidance |
| Demo format | slide deck of at most 7 slides, or a video of at most 30 seconds | 2026 project submission guidance |
| Data rule | at least one NASA or partner-agency resource must be used and cited | 2026 project resources guidance |
| AI rule | use of SI (LLM, code generation, image generation) is allowed and must be disclosed, with indication of where it was used | 2026 project resources guidance |
| Branding rule | no NASA logos, flags or mission identifiers may be used or modified | 2026 project resources guidance |

Deadline arithmetic: work happens on the night of 14 November IST. Everything in this repository is authored inside that window.

## 2. Problem

A crewed lander at the lunar south pole lives or dies on two numbers per hour: how much sunlight reaches the site, and whether Earth is above the local skyline for a direct radio link. Both bodies crawl within a few degrees of the horizon. A five hundred metre ridge decides whether a site gets power at all.

Existing planners answer this, but each one forces a slow loop: read a paper, open a separate ephemeris tool, open a DEM viewer, compare by hand. The challenge asks for exactly one thing: a tool that makes that comparison fast.

One sentence for a judge to repeat: **a tool that puts two candidate landing sites side by side, for a chosen date, and shows when the Sun and Earth clear the local ridge, for power and for direct-to-Earth comms.**

## 3. Users

| User | Job | What they need from the tool |
| --- | --- | --- |
| Mission planner (primary) | pick a landing region and a landing date | a ranked comparison of regions for a date range, with power %, comm %, and the worst outage |
| Systems engineer | size the solar array and the comm antenna | per-hour Sun elevation, Earth elevation, and time above the skyline |
| Educator or science communicator | explain why the pole is hard | a horizon view anyone can read in ten seconds |
| Curious public | see the Moon's polar geometry | a default view that needs no input |

## 4. Scope, locked

Shipped in this build:

1. **Horizon view** for one site: 360 degree skyline with the Sun and Earth tracks over a lunar day, plus the instantaneous positions, angles and clearance above the ridge.
2. **Comparison table** of eight published south-polar sites for one window: sunlit fraction, Earth-visible fraction, both, longest night, longest comm gap.
3. **Landing-window scan**: rank candidate dates for one site over a range of months.
4. **Terrain horizon input**: flat-horizon reference, a 16-sector editor, and a CSV horizon-profile import. The mask is carried into every number the tool prints.
5. **Model page** stating frames, models, validation residuals, and limits in plain language.
6. URL state for every control, so a planner can send a link to a colleague.
7. CSV export of the comparison and of the hourly series.

Explicitly out of scope, named so nothing silently drifts in:

- Landing hazard detection, slope maps, boulder fields, PSR cold-trap mapping.
- Link budgets, antenna pointing, thermal, radiation, regolith mechanics.
- Trajectory, delta-v, launch windows, ascent and descent guidance.
- Real-time operations, any server-side user data, accounts or persistence.
- A DEM ray-marcher inside the browser. The tool consumes a horizon profile, which is what a DEM produces; the derivation command is documented.

## 5. What makes this entry different

Four public repositories already address this same 2026 challenge. Each either fixes a small site list, hides the terrain model, or reduces the hard part to a decorative 3D scene. Three product decisions separate this build:

1. **Terrain is an input you can inspect and change.** The horizon is a named array in the URL. Its source is labelled on screen: flat reference, user profile, or imported file. No site gets a skyline it cannot explain.
2. **The physics is local, deterministic and audited.** Solar and lunar positions, the lunar rotation model, and the site geometry are computed in the browser from published series, then checked against JPL Horizons DE441 with residuals published in the app. No API keys, no network at run time, no guessed numbers.
3. **The output is a decision.** The ranked table answers "which region, which date, and how bad is the worst gap" with one number per column, and exports as CSV.

## 6. Requirements

Numbered requirements with acceptance criteria. `MUST` items block release; `SHOULD` items release with a note in `docs/BUILD-PLAN.md` if dropped.

| ID | Requirement | Acceptance |
| --- | --- | --- |
| R1 | Sun and Earth selenographic sub-points at any instant from 2020 to 2040 | matches JPL Horizons DE441 within 0.02 deg on sub-solar latitude, 0.05 deg on longitude, for every epoch in `validation/horizons-epochs.json` |
| R2 | Site topocentric elevation and azimuth | matches JPL Horizons topocentric output at a published site within 0.02 deg for every sample in `validation/horizons-site.json` |
| R3 | Terrain-aware visibility | a body counts as visible when its centre elevation exceeds the interpolated horizon at that azimuth; the disc fraction above the ridge is reported |
| R4 | Comparison across sites | one window, eight sites, four metrics, sorted on any column, exported to CSV |
| R5 | Date scan | at least 12 candidate dates ranked by a stated composite score, with the score and its weights shown |
| R6 | URL state | every control round-trips through the URL; a copied link reproduces the exact view |
| R7 | Keyboard | every control reachable and operable without a pointer; `Cmd/Ctrl+K` opens a command palette |
| R8 | Accessibility | WCAG 2.2 AA for text contrast, focus visible, 44 px touch targets, no motion on first paint, reduced-motion honoured |
| R9 | Honesty | every model assumption is stated on screen where it affects a number; no unlabelled synthetic data anywhere |
| R10 | Performance | first contentful paint under 1.5 s on a mid-range laptop; the 30-day hourly series for eight sites computes in under 400 ms |
| R11 | SI disclosure | a page and a README section listing generative tools used and where |
| R12 | No NASA branding | no NASA logo, flag or mission identifier; an independence note in the footer |

## 7. Success test

A judge with no briefing opens the site. Within thirty seconds they should be able to say: what this measures, which sites are being compared, and why the ridge matters. Within two minutes they should have changed the date and seen the table reorder.

## 8. Risks and mitigations

| Risk | Effect | Mitigation |
| --- | --- | --- |
| No DEM is reachable from the build environment | terrain-grade realism is limited | ship a horizon-profile import plus an editable mask; state the limit on the model page; document the one-command derivation path |
| Physics wrong in a frame convention | every number is wrong | validate against JPL Horizons before any UI work; publish residuals |
| Scope creep across four candidate challenges | nothing finishes | challenge chosen and locked here; 14-challenge scoring in `docs/RESEARCH.md` |
| Deadline passes mid-work | no submission | documentation, submission copy, script and deck are produced before the last code pass |
