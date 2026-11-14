# Architecture

## 1. Shape

A static web application. No server, no database, no API key, no run-time network call. Everything the user sees is computed in the browser from published series, which is what makes the demo instant and the claims auditable.

```
browser
  routes (URL is the only state)
    /            overview: what the tool measures, comparison for today
    /horizon     horizon view: one site, one date, sky tracks, terrain mask
    /compare     ranked comparison: eight sites, one window, CSV export
    /dates       landing-window scan: one site, many dates, ranked
    /sites       catalogue with coordinates and their published sources
    /model       frames, models, residuals, limits, SI disclosure
  engine (pure TypeScript, no DOM)
    time -> ephemeris -> lunarFrame -> geometry -> site -> planner
  validation fixtures (JPL Horizons snapshots) -> regression test + Model page table
```

## 2. Stack decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Framework | Vite 8 + React 19 + TypeScript | static output, one command build, no server needed; the app is a tool, not content |
| Styling | hand-authored CSS with a token layer | a component library would import someone else's defaults; the design is specified in `DESIGN.md` |
| Charts | Canvas 2D for the panorama, SVG for diagrams, DOM for tables | the panorama redraws on scrub; the tables must be real, accessible, selectable text |
| Routing | History API, ~40 line router | five screens; a router dependency buys nothing |
| State | URL search parameters | shareable links, working back button, refresh safe, no store to sync |
| Ephemeris | `astronomia` (MIT, Meeus series) | 60-term lunar series is not something to retype; the library reproduces the book's worked example exactly |
| Tests | `vitest` for engine units, `scripts/validate.ts` for Horizons residuals | the science is the product; it gets the test budget |

## 3. Module map and budgets

| Module | Responsibility | Budget |
| --- | --- | --- |
| `src/engine/time.ts` | Julian day, TT offset, century arguments | 40 lines |
| `src/engine/ephemeris.ts` | Sun and Moon positions, obliquity, precession to ICRF | 90 lines |
| `src/engine/lunarFrame.ts` | IAU lunar rotation, body axes, sub-points | 110 lines |
| `src/engine/geometry.ts` | one instant: Sun and Earth sub-points, Earth range | 40 lines |
| `src/engine/site.ts` | local frame, elevation and azimuth, horizon mask, profile import | 120 lines |
| `src/engine/planner.ts` | sampling, runs, summaries, composite score, CSV | 130 lines |
| `src/engine/sites.ts` | catalogue data with per-entry source | 120 lines |
| `src/ui/*` | shell, screens, components | the rest |

Rule: `src/engine` imports nothing from `src/ui` and touches no browser global except `performance.now`.

## 4. Performance

- One ephemeris evaluation costs about 2 microseconds. A 30 day window at 10 minute steps is 4320 evaluations, around 10 ms, shared by every site in the comparison.
- Default comparison window: 30 days, 30 minute steps, 8 sites, computed once per window change and memoised.
- The panorama redraws only the canvas on scrub; geometry is memoised on the sample index.
- Bundle target: under 120 kB gzipped JavaScript. `astronomia` is imported by submodule so only the lunar and solar series ship.

## 5. Accessibility and interaction contract

- Skip link, one `h1` per screen, landmarks (`nav`, `main`, `footer`), visible focus ring, 44 px targets on touch.
- Every number that changes is announced through a polite live region only when the user commits a change, not on every scrub frame.
- All controls are native elements: `select`, `input`, `fieldset`, `details`, `dialog` for the command palette, `table` for the tables.
- Reduced motion: the only animation is a 120 ms ease-out state transition on hover and press, disabled under `prefers-reduced-motion`.

## 6. Security

- No authentication, no user data, no cookies, no analytics, no third-party requests at run time.
- Strict Content Security Policy delivered by meta tag and by `netlify.toml` headers: `default-src 'self'`, no inline script, `frame-ancestors 'none'`.
- CSV import and horizon import parse locally, validate ranges, never execute.
- CSV export is generated from a Blob with `text/csv`, no external service.

## 7. Hosting

Two supported paths, both static:

1. **Netlify** (preferred). `netlify.toml` sets build `npm run build`, publish `dist`, SPA rewrite to `/index.html`, and the security headers. Deploy from a machine with network access:

   ```bash
   NETLIFY_AUTH_TOKEN=<token> npx netlify-cli deploy --prod --dir=dist
   ```

   The token is never written to this repository. Sandbox note: `api.netlify.com` is unreachable from the build environment used here, so the deploy step is left to the operator.
2. **Any static host**: upload `dist/`.

## 8. Definition of done

`npm run verify` must pass: type check, unit tests, validation residual thresholds, production build, and a link check over `dist`. The Model page must render the same residual table that the validator wrote, from the same JSON.
