# Science specification

Every number the tool prints comes from this note. If code and note disagree, the note wins and the code is wrong.

## 1. Frames

| Frame | Definition | Used for |
| --- | --- | --- |
| ICRF / J2000 equatorial | geocentric mean equator and equinox of J2000 | internal working frame for all vectors |
| Mean ecliptic of date | as produced by the Meeus position series | output of the Sun and Moon position functions |
| Mean Earth / selenographic | +Z rotation axis, +X prime meridian facing the Earth, longitude positive east, +Y at 90 deg east | everything the user sees |
| Local horizontal at a site | up = site radius direction, east = increasing longitude, north = east cross up | elevation and azimuth |

## 2. Time

- Unix milliseconds to Julian Day (UTC): `JD = ms / 86400000 + 2440587.5`.
- Dynamical time: `JD_TT = JD_UTC + 69 s`. A fixed offset holds 2020 to 2040 inside half a second, which displaces the Moon by less than 0.3 arcsec. Stated as a shortcut in code.
- The Julian centuries argument is `T = (JD_TT - 2451545) / 36525`.

## 3. Positions

**Sun** (Meeus, Astronomical Algorithms, ch. 25 low-precision solar coordinates). Geometric longitude, mean equinox of date; error below 0.01 deg, which is 0.0002 rad, negligible against a 0.02 deg tolerance. Distance from the eccentricity series.

**Moon** (ch. 47, full truncated ELP series, 60 periodic terms, as implemented by the `astronomia` library). Geometric longitude and latitude, mean equinox of date, distance in kilometres. Verified against the book's worked example 47.a: longitude 133.162655 deg, latitude -3.229126 deg, distance 368409.7 km, which the engine reproduces to the printed precision.

**Direction from the Moon to each body**

- Earth: `-r_moon`, since the Earth's centre seen from the Moon's centre is the reverse of the Moon's geocentric vector.
- Sun: `r_sun_from_earth - r_moon_from_earth`. The offset matters: the Moon sits up to 384 400 km from the Earth, which displaces the solar direction by up to 0.147 deg, larger than the whole accuracy budget. Computed, not approximated.

**Ecliptic of date to ICRF**: rotate by the mean obliquity of date about the x axis, then apply the inverse IAU 1976 precession rotation (Meeus ch. 21, zeta, z, theta) with the sign convention such that date to J2000 is the exact inverse of J2000 to date.

## 4. Lunar rotation (IAU model)

Euler angles from the IAU Working Group on Cartographic Coordinates and Rotational Elements, lunar model, with the thirteen periodic arguments E1 to E13 driven by days since J2000:

```
alpha0 = 269.9949 + 0.0031 T - 3.8787 sinE1 - 0.1204 sinE2 + 0.0700 sinE3 - 0.0172 sinE4
         + 0.0072 sinE6 - 0.0052 sinE10 + 0.0043 sinE13
delta0 =  66.5392 + 0.0130 T + 1.5419 cosE1 + 0.0239 cosE2 - 0.0278 cosE3 + 0.0068 cosE4
         - 0.0029 cosE6 + 0.0009 cosE7 + 0.0008 cosE8 - 0.0009 cosE10 + 0.0003 cosE13
W      =  38.3213 + 13.17635815 d + 3.5610 sinE1 + 0.1208 sinE2 - 0.0642 sinE3 + 0.0158 sinE4
         + 0.0252 sinE5 - 0.0066 sinE6 - 0.0047 sinE7 - 0.0046 sinE8 + 0.0028 sinE9
         + 0.0052 sinE10 + 0.0040 sinE11 + 0.0019 sinE12 - 0.0044 sinE13
```

Body axes in ICRF: `Z = unit(alpha0, delta0)`, `N = unit(k_ICRF cross Z)`, `X = cosW N + sinW (Z cross N)`, `Y = Z cross X`.

Sub-point of a direction `v`: longitude `atan2(v.Y, v.X)`, latitude `asin(v.Z)`, both degrees, longitude positive east.

Note on frames: JPL Horizons reports in the MOON_ME frame. The IAU model is a close but not identical realisation. Measured residuals are in section 8 and are used as the stated accuracy.

## 5. Site geometry

For a site at selenographic `(lon_s, lat_s)` and a body at sub-point `(lon_b, lat_b)`:

```
up    = unit(lon_s, lat_s)            in body frame
east  = (-sin lon_s, cos lon_s, 0)
north = up cross east
v     = unit(lon_b, lat_b)
elevation = asin(v . up)
azimuth   = atan2(v . east, v . north), folded to 0..360
```

Azimuth is clockwise from north, the same convention Horizons uses, so the comparison is like for like.

## 6. Terrain

A horizon mask is 16 sector values in degrees, one per 22.5 deg of azimuth, linearly interpolated between sector centres. Visible means `elevation > horizon(azimuth)`.

Disc fraction above the ridge is reported as `clamp((el + r - h) / (2 r), 0, 1)` where `r` is the angular radius of the body (Sun 0.266 deg, Earth `asin(6378.137 / range)` about 0.95 deg) and `h` is the horizon. This is a linear scan across the disc, not an integral over the limb; it is labelled as an approximation in the interface.

Masks are produced one of three ways, and the interface always names which:

1. **Flat reference**: zeros. The geometric ceiling, no terrain. This is the default so that no number is silently terrain-corrected by data the user cannot see.
2. **Edited**: the user sets sector values.
3. **Imported**: CSV of `azimuth, horizon elevation`, resampled to the 16 sectors by circular linear interpolation.

Deriving a profile from a real DEM is a documented one-liner (`docs/DATA-SOURCES.md`, gdalinfo and a python snippet) rather than a bundled ray-marcher, because no DEM is reachable at build time.

## 7. Metrics

Sampling default: 10 minute steps across the selected window; the comparison table uses 30 minute steps.

- `sunlit%`: fraction of samples with the Sun visible over the mask.
- `comm%`: fraction of samples with the Earth visible over the mask and above the comm elevation floor (default 5 deg).
- `both%`: fraction with both true.
- `longestNight`: longest contiguous run without Sun, hours.
- `longestCommGap`: longest contiguous run without Earth, hours.
- `insolationIndex`: mean of `max(0, sin(elevation))`, a proxy for panel power per unit area, unitless 0 to 1.

Composite window score, used for ranking, weights exposed in the interface:

```
S = 0.45 sunlit% + 0.35 comm% + 0.20 both% - 20 min(1, longestCommGap / 12)
```

Range roughly -20 to 100. The subtraction punishes a long blackout, which no additive average would catch. The tool labels S as a planning aid, not a NASA figure.

## 8. Accuracy budget and acceptance

Validated against JPL Horizons, DE441, geocentric observer, MOON_ME frame, apparent values.

| Quantity | Acceptance | Reason |
| --- | --- | --- |
| Sub-solar latitude | within 0.02 deg | drives solar elevation one to one |
| Sub-solar longitude | within 0.05 deg | at 89 deg south, longitude error moves elevation by cos(lat) times the error, under 0.001 deg |
| Sub-Earth latitude and longitude | within 0.05 deg | Earth stays within 8 deg of the sub-polar point; terrain and the 5 deg floor dominate |
| Site azimuth | within 0.3 deg | used for the horizon lookup, which has 22.5 deg sectors |
| Site elevation | within 0.02 deg | the number that decides visibility |

Residual tables are generated by `npm run validate` and published on the Model page. A failed row fails the build.

## 9. What this model does not do

- No limb integration over terrain, no ray tracing, no multipath.
- No atmospheric refraction (correct: the Moon has none) and no light-time inside the terrain step.
- No solid-Earth or lunar tide, no relativistic terms, no nutation beyond the precession model, no polar wander.
- No thermal, power-system, or antenna model. The tool prints geometry; the engineer supplies the hardware.

Each of these is a stated limit, not a hidden assumption.
