# Validation against JPL Horizons

Generated 2026-11-14T19:13:31.004Z by `node --experimental-strip-types scripts/validate.ts`.
The same run writes `validation/residuals.json`, which the model screen reads at runtime, so the numbers on the
website are the numbers in this report.

## What was compared

Six independent quantities, each a vector subtraction between a JPL Horizons value and the value Selenorizon
computes for the same instant:

1. **Sub-solar latitude and longitude** - the point on the lunar surface with the Sun overhead, from the Moon
   apparent-orbit table in the Moon-fixed frame (`horizons-epochs.json`, 13 instants across a synodic month).
2. **Sub-Earth latitude and longitude** - the libration point, same file, same instants.
3. **Site elevation and azimuth** - apparent topocentric horizontal coordinates of the Sun and of Earth from
   three real surface points (`horizons-site.json`, 28 rows).
   These include the observer-surface parallax, so they are the quantities the app actually plans with.

All angles are in degrees. Longitude residuals are wrapped to the range -180 to 180 before scoring.

## Results

| Quantity | Points | Max residual (deg) | RMS (deg) | Tolerance (deg) | Status |
| --- | --- | --- | --- | --- | --- |
| Sub-solar latitude | 13 | 0.0031 | 0.0016 | 0.02 | pass |
| Sub-solar longitude | 13 | 0.0140 | 0.0096 | 0.05 | pass |
| Sub-Earth latitude | 13 | 0.0047 | 0.0018 | 0.05 | pass |
| Sub-Earth longitude | 13 | 0.0074 | 0.0045 | 0.05 | pass |
| Site elevation | 28 | 0.0020 | 0.0015 | 0.02 | pass |
| Site azimuth | 28 | 0.0072 | 0.0056 | 0.1 | pass |

The tolerance is not a comfortable round number. At the south pole the Sun never climbs higher than about two
degrees, so a 0.02 degree elevation error is roughly one percent of the whole signal; a planner that was off by
half a degree would get ridge occlusion wrong for hours at a time. Azimuth is looser because it is multiplied by
the cosine of a small elevation before it can affect visibility.

## Worst residuals

### Sub-solar latitude

| Reference instant | Horizons value | Selenorizon value | Residual |
| --- | --- | --- | --- |
| 2027-12-22T00:00:00Z | -0.8297 | -0.8328 | -0.0031 |
| 2026-01-01T00:00:00Z | -1.3464 | -1.3438 | +0.0027 |
| 2026-12-27T00:00:00Z | -1.1167 | -1.1187 | -0.0021 |

### Sub-solar longitude

| Reference instant | Horizons value | Selenorizon value | Residual |
| --- | --- | --- | --- |
| 2026-04-01T00:00:00Z | 17.3577 | 17.3717 | +0.0140 |
| 2028-06-19T00:00:00Z | 221.6217 | -138.3659 | +0.0124 |
| 2027-06-25T00:00:00Z | 290.1553 | -69.8334 | +0.0113 |

### Sub-Earth latitude

| Reference instant | Horizons value | Selenorizon value | Residual |
| --- | --- | --- | --- |
| 2028-03-21T00:00:00Z | -0.4974 | -0.4927 | +0.0047 |
| 2027-03-27T00:00:00Z | 6.5302 | 6.5331 | +0.0029 |
| 2026-09-28T00:00:00Z | -5.2993 | -5.2977 | +0.0016 |

### Sub-Earth longitude

| Reference instant | Horizons value | Selenorizon value | Residual |
| --- | --- | --- | --- |
| 2026-01-01T00:00:00Z | 358.7165 | -1.2761 | +0.0074 |
| 2026-04-01T00:00:00Z | 4.5499 | 4.5569 | +0.0070 |
| 2027-03-27T00:00:00Z | 4.8878 | 4.8932 | +0.0054 |

### Site elevation

| Reference instant | Horizons value | Selenorizon value | Residual |
| --- | --- | --- | --- |
| connecting-ridge-sun 2026-12-15T00:00:00Z | 1.2866 | 1.2846 | -0.0020 |
| connecting-ridge-sun 2026-12-27T00:00:00Z | 0.9272 | 0.9292 | +0.0020 |
| connecting-ridge-sun 2026-12-18T00:00:00Z | 0.9816 | 0.9798 | -0.0018 |

### Site azimuth

| Reference instant | Horizons value | Selenorizon value | Residual |
| --- | --- | --- | --- |
| connecting-ridge-sun 2026-12-27T00:00:00Z | 113.9086 | 113.9158 | +0.0072 |
| connecting-ridge-sun 2026-12-06T18:00:00Z | 0.1030 | 0.1099 | +0.0069 |
| connecting-ridge-sun 2026-12-24T00:00:00Z | 150.2810 | 150.2879 | +0.0068 |

## Reproduction

```bash
npm run verify
```

`verify` runs the type checker, the test suite, this residual report, and the production build. The report exits
non-zero if any group leaves tolerance, so a regression fails the build rather than shipping quietly.

## What this establishes, and what it does not

**Establishes.** The solar and lunar position series, the IAU 2009 lunar rotation, and the site-to-body geometry
agree with JPL Horizons to well inside the tolerance above, at the sites the catalogue uses, over 2026 and 2027.

**Does not establish.** Anything about terrain. Real skyline profiles come from LOLA digital elevation models and
are not shipped with this repository; the app takes a skyline as an input and says so on every screen that uses
one. See `docs/DATA-SOURCES.md` for what a real deployment would load, and `docs/SCIENCE.md` for the model
that would consume it.
