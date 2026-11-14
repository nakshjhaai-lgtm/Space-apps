# UX specification

## 1. Routes and URL state

The URL is the whole application state. Every control writes to the query string, and a copied URL reproduces the screen exactly.

| Route | Query parameters | Screen |
| --- | --- | --- |
| `/` | `s`, `t` | what the tool measures, the selected site's current reading, and a link into each tool |
| `/horizon` | `s` site id, `t` ISO instant (UTC), `h` horizon mode, `hz` 16 comma separated degrees when edited, `floor` comm floor in degrees | panorama, readouts, sector editor, 30 day strip |
| `/compare` | `t` start date, `d` window days, `sort` column, `h`/`hz`, `floor` | ranked table of all catalogue sites, export button |
| `/dates` | `s`, `from`, `to`, `nights` | candidate landing dates ranked for one site |
| `/sites` | `s` | catalogue with coordinates, sources, and a link into the horizon view |
| `/model` | none | frames, models, residuals, limits, privacy, SI disclosure |
| anything else | none | 404 with the five destinations |

Defaults, so that a first visit shows a real answer and not an empty state: site `connecting-ridge`, instant now rounded to the hour, horizon `flat`, comm floor `5`, compare window `30` days from today, sort `score`.

Invalid parameters never throw. Each parser clamps to a valid value, keeps the rest of the URL, and the screen states what it substituted.

## 2. Screen contracts

### Overview `/`
- One `h1` that names the measurement, not the product.
- A short paragraph: what a planner decides here.
- "Reading at your site now": six readouts (Sun elevation, Sun clearance over horizon, Earth elevation, Earth clearance, sunlit share over 24 h, Earth share over 24 h), each with provenance.
- Two next actions: `Open the horizon view`, `Compare all sites`.
- A single note: which horizon model is in force.

### Horizon `/horizon`
- Left: panorama canvas, 0 to 360 azimuth, -12 to +12 elevation, filled horizon silhouette, Sun track over the next 24 h as a thin amber line, Earth track as a thin earth-blue line, current positions as discs with labels, `occluded` printed beside a marker that is behind the ridge.
- Right: readouts grid, then the sector editor, then the horizon import, then the comm floor.
- Below: a 30 day strip, one cell per 6 hours, four states (both, power only, comm only, neither) with a legend and a text alternative table behind a `details` element.
- Scrub: a native range input over the 30 day window, plus a `Play 30 days` button (1 day per second, stops at the end, pauses when the tab hides).

### Compare `/compare`
- One table, all catalogue sites: name, region, latitude, longitude, sunlit %, Earth %, both %, longest night, longest comm gap, score.
- Sortable on every numeric column, sort direction stated in the header.
- `Export comparison as CSV` and `Copy link to this view`.
- Model note under the table: window, step, horizon mode, comm floor.

### Dates `/dates`
- One site, a date range, and a mission length in days.
- Table of candidate start dates ranked by score, with the date, score, sunlit %, Earth %, longest comm gap.
- `Use this date in the horizon view` on every row.

### Sites `/sites`
- Cards are not used. The catalogue is a definition list per site: name, region, coordinates split into south latitude and east longitude, published source with a link, and one line on why the site matters.
- The selected site is marked with the word `selected` and a left rule, not with colour alone.

### Model `/model`
- Frames, series, accuracy table from the validation JSON, limits, privacy, independence, SI disclosure.
- A `details` element per section, all closed except the accuracy table.

## 3. States

| State | Behaviour |
| --- | --- |
| First paint | no entrance animation, no skeleton. Content is present on the first frame |
| Computing | a status line in the shell footer reads `Computing window…` only if a computation exceeds 150 ms; nothing else moves |
| Long range requested | step is coarsened automatically, and the note states the step actually used |
| Invalid date | the field keeps the text, an inline message states the accepted format, the rest of the screen keeps the last valid value |
| Invalid horizon import | the import box shows the failing row and the accepted format, and the previous mask stays in force |
| Empty catalogue filter | the list states that no site matches and offers `Show all sites` |
| 404 | the five destinations, a one line explanation, and the palette hint |
| Offline | the whole app works offline after first load; no banner is needed |

## 4. Keyboard

| Keys | Action |
| --- | --- |
| `Cmd/Ctrl + K` | open the command palette |
| `Esc` | close palette or dialog, return focus to the trigger |
| `g` then `o` / `h` / `c` / `d` / `s` / `m` | go to overview, horizon, compare, dates, sites, model |
| Left/Right on a focused sector handle | change that sector by 0.5 deg, `Shift` for 2 deg |
| Space on the panorama | start or stop the 30 day sweep |
| Tab order | rail, main controls, table, footer, in that order; skip link first |

## 5. Copy rules applied

- No em dashes anywhere in the interface.
- Numbers with units use a non-breaking space.
- Each error names the failure and the fix.
- No exclamation marks, no hype adjectives, no invented urgency.
- Every panel heading is a sentence about content, for example `Where the Sun sits today`, not `Overview`.

## 6. Responsive

| Width | Layout |
| --- | --- |
| 1280 and up | rail plus two columns, panorama 62 percent |
| 900 to 1279 | rail collapses to a 56 px icon rail with text labels hidden but present for assistive tech; single column |
| 768 | full width, panorama keeps 2:1 ratio, readouts become two columns |
| 390 and 320 | single column, readouts stack, tables scroll horizontally with the first column pinned, controls occupy full width, all targets 44 px |

No horizontal page scroll at any width. The panorama scales with its container, never with a fixed pixel width.
