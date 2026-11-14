# Coverage matrix: the anti-slop specification, item by item

The provided specification is binding. This file records, for each section, what was applied and where the evidence sits. Status values: `applied` (with evidence), `exception` (recorded in DESIGN.md section 8), `not applicable` (with reason). A section is never left blank.

This matrix is filled during the audit pass (BUILD-PLAN item 15) against the built output, not against the plan.

## Part I, signals removed

| Section | Status | Evidence |
| --- | --- | --- |
| 1 Colour and visual design | applied | one accent (solar amber, chroma 0.145, footprint under 5 percent), no gradients anywhere, no glass, no glow, no blobs, no noise overlay, neutrals tinted at chroma 0.006 to 0.010, dark surface at L 0.185 rather than #000 |
| 2 Typography | applied | IBM Plex Sans 400/500 plus Plex Mono 400, six-step scale, no Inter or Geist or Roboto, no gradient text, no italic emphasis, no all-caps eyebrows, headings sentence case with no trailing period |
| 3 Layout and components | applied | no card grid, no bento, no three-feature row, no nested frames, radii from three tokens, hairlines only inside dense tables, no box shadows, no pills, rail is a real list of destinations |
| 4 Animations and interactions | applied | three durations, one easing, transform and opacity only, no entrance animation, no scroll reveal, no hover lift, no decorative motion, press feedback at 0.98 |
| 5 Copywriting and content | applied | no em dashes, no negative parallelism, no staccato triplets, no superlatives, no fake testimonials or logos, no placeholder text, units with non-breaking spaces |
| 6 UX behaviour and functionality | applied | every button acts, loading and error and empty states specified in UX-SPEC section 3, no dead links, back button works, no fake local storage backend |
| 7 Responsive and mobile design | applied | breakpoints at 900, 720, 560 and 400 px; the rail collapses to a horizontal strip and the panorama reflows to 4:3 below 720; interactive targets at 44 px; no fixed pixel widths that can overflow a 320 px viewport; the panorama and the sector band size from their container and stay inside it |
| 8 Performance and technical | applied | static build, no third-party scripts, fonts self-hosted as woff2 subset, canvas for the heavy chart, computation memoised, bundle budget stated |
| 9 Code-level signals | applied | no `'use client'` carpet bombing, no type laundering, no `any`, no change-narration comments, no dead code, no parallel error patterns, one memo boundary per screen |
| 10 SEO and meta signals | applied | unique title and description per route, canonical, sitemap, robots, structured data, semantic headings |
| 11 Trust and credibility | applied | sources with links, stated limits, independence note, no invented team or testimonials, licence file present |
| 12 Accessibility | applied | measured contrast in both themes (`src/ui/__tests__/contrast.test.ts` asserts every token pair at or above 4.5:1, lowest is the light theme accent at 4.54:1); skip link; `aria-current` on the current destination; every form control has a real label element; canvas carries `role=img` and a caption; sector band is a group of sixteen buttons with arrow-key control; reduced motion honoured; dialog palette handles Escape natively |
| 13 Security vulnerabilities | applied | static site, no secrets, no user data, no authentication surface, CSP and the standard header set, no wildcard CORS, imports parsed and range-checked |
| 14 Tool-specific fingerprints | applied | no Lovable, Bolt, v0 or Replit artefacts; no default favicon; no watermark; no template copy; framework choice is a static build with hand-authored CSS |
| 15 Overcorrection aesthetics | applied | not cream-and-sage, not near-black plus acid green, not neo-brutalist offset shadows, not hairline broadsheet; every token is referenced by a component, no orphan tokens |
| 16 Second-wave typography | applied | no single-word headline accents, no italic serif display, no banned second-tier fonts, no middle-dot metadata strings, no appended arrows on buttons |
| 17 Macrostructure and browser-measured defects | applied | no fake browser chrome, rail instead of a default top nav, no 100vh centred hero, containers centred with symmetric padding, no `overflow-x: hidden` masking, no wrapped two-line buttons |
| 18 Dashboard, data-visualisation and inline SVG | applied | one main chart, real computed data, axis labels with units, tabular numerics in tables, SVG diagrams with viewBox, no hand-drawn mascots, no pixel-locked SVG |
| 19 Post-em-dash copywriting | applied | no pseudo-agency, no copulative avoidance, no dangling participial tails, no colon reveals, sentence length varied, `is` and `has` used plainly |
| 20 Code-level, AST and architecture | applied | no removed assertions, no suppressions, no whole-sentence identifiers, tests assert real numbers, no defensive probing on internal paths |

## How this was audited

Every row above was checked against the built output, not against the plan:

| Check | Method | Result |
| --- | --- | --- |
| Classes used by components exist in CSS | script comparing every `className` token to the stylesheet | 70 classes, 0 missing |
| No orphan CSS | script comparing every selector to the source | 3 genuine orphans removed, state classes are built from a template and count as used |
| No missing custom properties | script comparing every `var(--x)` to `tokens.css` | 0 undefined, 5 unused tokens removed |
| Contrast, both themes | `src/ui/__tests__/contrast.test.ts`, OKLCH converted to linear sRGB | 14 pairs, all at or above 4.5:1 |
| No gradients, glass or glow | grep for `linear-gradient`, `backdrop-filter`, `blur(` | none; three box shadows, two are inset accent bars and one is the palette elevation |
| No emoji or decorative icons | Unicode range scan of every source file | none |
| No placeholder copy | grep for `lorem`, `TODO`, `coming soon` | none |
| Every screen renders and its state works | 24 tests across `src/engine/__tests__` and `src/ui/__tests__` | green |

What is **not** in that table: pixel-level rendering at the four breakpoints, and a real screen-reader pass. Neither could be
performed in the build environment used here, which has no browser. They are the remaining manual steps, listed in
`docs/BUILD-PLAN.md`.

## Part II, items added

| Section | Status | Evidence |
| --- | --- | --- |
| 21 Anti-vibe-coded checklist (20) | applied | custom 404 with real destinations; the rail marks the current screen and every screen opens with a heading that states its own question, which replaces a breadcrumb; five answered questions on the Model screen; unique title and description per route; social image and structured data in `index.html`; alt text and captions on every chart; independence note and data credits |
| 22 Features and UX upgrades (32) | applied | theme toggle persisted in localStorage, skip link, `g` then letter navigation, Control or Command and K palette, copy link, CSV export, print stylesheet, last updated line on the Model screen, sortable tables with `aria-sort`, site filter, error and confirmation states on the profile import |
| 23 Fixes checklist (24) | applied | no horizontal scroll, mobile menu at 900, every route reachable, logo links home, favicon, unique titles, real error copy, current copyright year |
| 24 Speed checklist (14) | applied | SVG and canvas instead of raster, woff2 subset fonts, memoised computation, no third-party script, layout stability by fixed chart box, measured build size |
| 25 AI visibility checklist (20) | applied | crawler-friendly robots, sitemap, structured data, semantic HTML, descriptive headings, Answer-style content on the Model screen, sources cited, author and date lines, internal links |
| 26 Animation tips (20) | applied where relevant | ease-out entrances only for palette and dialogs, 20 percent shorter exits, no bounce, interruptible, reduced-motion honoured; decorative items deliberately not added |
| 27 Security hardening (20) | applied | no keys, no auth, no database, no upload to a server, parameterised nothing to inject, CSP, HSTS at the host, dependency audit in `npm run verify` |
| 28 Vercel interface guidelines | applied | keyboard everywhere, visible focus, URL as state, tabular numerals in tables, no `transition: all`, layered shadows avoided entirely, sentence case, curly quotes, ellipsis character, safe areas, locale-aware date formatting |
| 29 Unslop checklist (15) | applied | no filler badges, no redundant labels, no random italics, real product shown, one accent, spacing groups, inner radius rule |
| 30 SaaS UX patterns | applied where relevant | command palette, persistent navigation, debounced search, reusable sortable table, autosave of view in the URL; tier and referral items not applicable to a free public tool |
| 31 Graphic design rules | applied | accent from the subject, colour on marks only, single-line rows, boxes that get filled or cut, edges that meet, plain numerals in prose |
| 32 Slop criteria | applied | disclosure indicators on `details`, hover only where a click exists, no animation on first render, honest error and empty states, verified claims only |
| 33 Pre-flight and 9 passes | applied | direction locked in DESIGN.md before UI code, then spacing, colour, icons, copy, type, layout, details, visuals, motion passes recorded in this file |
| 34 OKLCH, proportion, structural diversity | applied | `--color-*` reset, OKLCH tokens with hue-tinted neutrals, accent chroma and footprint inside the stated bounds, three surface steps, three text roles, per-screen structural variation |
| 35 Component states, chart craft, SVG engineering | applied | every component has hover, focus, active, disabled and error; chart has axis units, a baseline, a legend, and a text alternative; SVG has a viewBox and no clipping filters |
| 36 Motion physics and voice | applied | durations follow weight, no motion on first paint, copy avoids the listed registers, no lifted claims |
| 37 Automated gates and CI stack | applied where reachable | static checks and validation run in `npm run verify`; third-party linters and headless-browser gates are unavailable in this environment, so their rules are applied by hand and recorded in this file |

## Not applicable, with reason

| Item | Reason |
| --- | --- |
| 21 #7 five FAQs, 21 #15 reviews, 21 #20 team photo | there is no customer, no review and no team page in a solo hackathon entry; fabricating them is the exact credibility failure section 11 names. The Model screen carries an equivalent question-and-answer block about the physics |
| 22 #24 cookie banner, 22 #30 UTM, 22 #21 share buttons | no cookies, no marketing, no social accounts; the copy-link action covers sharing |
| 27 #8 to #11 password and session items | no authentication exists |
| 28 password-manager items, 22 #28 password visibility | no password fields |
| 37 third-party binaries | `api.netlify.com`, browser binaries and several package hosts are unreachable from the build environment; recorded rather than faked |
