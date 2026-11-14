# DESIGN.md

Design system for this project. Generated work must reference these tokens; a value outside this file is a defect. Root-level by intent: the audit rules look here first.

## 1. Direction, locked before any UI code

| Part | Decision |
| --- | --- |
| Reference | a survey instrument and a specification sheet: NTS traverse maps, aircraft attitude indicators, printed gear tables. Dense, quiet, numbered, no decoration that carries no reading |
| Character | exact, restrained, a little cold |
| World | grey regolith, hard sunlight, thin vacuum. The material is dust and steel, not glass and neon |
| Moments | two things carry colour: the Sun marker and the Sun track. Everything else is neutral or earth-tinted |
| Signature | every readout states its own provenance inline, for example `sun elevation +1.31 deg, horizon 0.00 (flat reference)` |

Rejected on purpose: hero section, feature triangle, bento grid, gradient anything, glass panels, floating cards, 3D globe as the main view, emoji, illustration.

## 2. Colour

OKLCH only. Neutrals carry a warm hue (75 to 80) at low chroma so nothing reads as dead grey. One accent, the Sun's amber, kept under 5 percent of pixels. A second data hue exists only inside charts, for the Earth series, and is never used for text or chrome.

Dark theme (default: this is a night-planning instrument):

```
--paper       oklch(0.185 0.008 75)   canvas
--paper-2     oklch(0.225 0.009 75)   raised surface
--paper-3     oklch(0.275 0.010 75)   selected row, input fill
--rule        oklch(0.335 0.010 75)   hairlines in dense tables only
--ink         oklch(0.945 0.006 80)   primary text
--ink-2       oklch(0.790 0.008 80)   secondary text
--muted       oklch(0.640 0.010 80)   tertiary, captions, axes
--accent      oklch(0.800 0.145 78)   Sun marker, Sun track, primary action
--earth       oklch(0.720 0.070 235)  Earth marker and track, chart series only
--danger      oklch(0.680 0.130 28)   occluded state, error text
```

Light theme:

```
--paper       oklch(0.968 0.006 80)
--paper-2     oklch(0.995 0.003 80)
--paper-3     oklch(0.930 0.008 80)
--rule        oklch(0.870 0.008 80)
--ink         oklch(0.225 0.010 75)
--ink-2       oklch(0.380 0.010 75)
--muted       oklch(0.505 0.010 75)
--accent      oklch(0.585 0.135 70)
--earth       oklch(0.490 0.080 240)
--danger      oklch(0.520 0.160 28)
```

Rules: text roles are exactly three (ink, ink-2, muted) and each has a job. Muted is captions and axis labels only, never body copy. Contrast meets 4.5:1 for body text and 3:1 for large text and chart strokes in both themes. Colour never carries state alone: every occluded reading also prints the word `occluded`.

## 3. Type

Two families, both self-hosted, both SIL OFL:

- **IBM Plex Sans** 400 and 500 for everything readable. 600 appears only in a table header.
- **IBM Plex Mono** 400 for strings a person would type or copy: coordinates, URLs, CSV headers, and the code block on the Model page.

Scale, fixed at six steps: 12, 13, 14, 16, 20, 28, 34. Body 16/1.55. Table numbers 13/1.4. Display 28 and 34 with `text-wrap: balance`, letter-spacing `-0.01em` at 28 and above, zero everywhere else.

No italics for emphasis. No gradient text. No all-caps tracking. No weight above 600. Numerals: `font-variant-numeric: tabular-nums` inside tables and readout grids where columns must align; plain numerals in prose.

## 4. Space, grid, radius

4 px base: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72. Group gaps (8 to 12) sit below section gaps (32 to 56), never at the same value. Two container widths only: the shell (rail 232 px plus main) and the reading column, `max-width: 68ch` for prose. Radii: control 8, panel 12, card 16, and inner radius equals outer minus padding.

Lines exist only where structure needs them: hairlines inside dense data tables and around input boundaries. Panels are grouped by surface step, not by borders. No framed box inside a framed box.

## 5. Components

| Component | Notes |
| --- | --- |
| Rail | fixed 232 px, wordmark, five destinations, live readout of the selected site, all links real |
| Panel | `--paper-2` surface, radius 12, 20 to 24 px padding, no border |
| Readout | label, value, provenance; value tabular; one row per measurement |
| DataTable | sticky header, sortable, real `table`, hairlines between rows only, right-aligned numerics |
| Panorama | canvas, azimuth 0 to 360 horizontal, elevation -12 to +12 vertical, horizon fill, Sun and Earth tracks, no gridlines beyond 45 deg ticks |
| SectorEditor | 16 vertical drag handles on a shared baseline, arrow-key operable |
| Threshold | native range input with a numeric readout beside it, never a custom slider alone |
| CommandPalette | native `dialog`, 8 entries maximum, fuzzy match on destination names |
| Note | inline model caveat, `--paper-3`, no icon, no badge |

## 6. Motion

Three durations: 120 ms for feedback (hover, press, focus), 240 ms for a context change (panel swap, palette open), 0 for first paint. One easing, `cubic-bezier(0.2, 0, 0, 1)`. Animate `transform` and `opacity` only. Press scales to 0.98. No entrance animations, no scroll effects, no pulsing, no parallax. `prefers-reduced-motion` removes all of it.

## 7. Copy

Second person, active voice, numerals for counts. No em dashes, no negative parallelism, no three-beat slogans, no colon reveals. Buttons name the action and its object (`Copy link to this view`, `Export comparison as CSV`). Errors say what failed and how to recover. Units are separated from numbers by a non-breaking space. Coordinates are labelled `south latitude` or `east longitude`, never a bare sign.

## 8. Recorded exceptions

| Exception | Reason |
| --- | --- |
| Dark theme is the default | night-shift mission planning, and the subject is a near-black sky; light theme ships and is one click away |
| Monospace used for coordinates | a user copies them into other software; this is the "strings a person types" case |
| Tabular figures inside tables only | column alignment in dense data is the one place where they beat proportional figures |
