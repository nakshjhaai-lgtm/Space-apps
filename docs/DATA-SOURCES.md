# Data sources, licences and attributions

Every source is cited here, then again in the interface, then again in the submission text. Nothing is used without a line in this file.

## 1. NASA and partner-agency resources

| Resource | What it is | How this project uses it | Link |
| --- | --- | --- | --- |
| JPL Horizons system, ephemeris DE441 | NASA/JPL Solar System Dynamics, sub-arcsecond planetary ephemerides over an HTTP API | reference truth for validation: sub-observer and sub-solar selenographic coordinates at 13 epochs from 2026 to 2028, plus topocentric azimuth and elevation at two published sites. Snapshots are committed in `validation/` | ssd.jpl.nasa.gov/api/horizons.api |
| Artemis III candidate landing regions | NASA announcement, August 2022, of 13 candidate regions near the lunar south pole | the site catalogue is built around these names | nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/ |
| Published candidate coordinates | LPSC 2024 abstract 1695; Wueller et al. 2026, JGR Planets; arXiv:2406.19863 | each catalogue entry carries the coordinates and the paper it came from, shown in the interface | hou.usra.edu/meetings/lpsc2024/pdf/1695.pdf; doi.org/10.1029/2025JE009434; arxiv.org/abs/2406.19863 |
| LRO LOLA polar DEM, `LDEM_80S_80M` | laser altimetry digital elevation model of the south polar region, NASA PDS | not bundled. Documented as the source for a horizon profile, with the derivation command in section 4 | pds-geosciences.wustl.edu, LOLA reduced data records |
| NASA SVS CGI Moon Kit | LROC colour mosaic and LOLA global relief, NASA Scientific Visualization Studio | referenced as the optional source for a colour basemap if a future version renders the globe | svs.gsfc.nasa.gov/4720 |

## 2. Models and software

| Item | Licence | Role |
| --- | --- | --- |
| IAU Working Group on Cartographic Coordinates and Rotational Elements, 2015 report (Archinal et al.) | published standard, public | lunar pole and prime meridian model |
| Meeus, *Astronomical Algorithms*, 2nd edition, chapters 21, 25, 47 | published reference | precession, solar position, lunar position series |
| `astronomia` v4.3, commenthol | MIT | implementation of the Meeus ch. 47 lunar series and ch. 25 solar series |
| React 19, Vite 8, TypeScript | MIT | application shell |
| IBM Plex Sans and IBM Plex Mono, IBM | SIL Open Font License 1.1 | interface typefaces, self-hosted through `@fontsource` |

## 3. Tooling used to build this entry (SI disclosure)

NASA's 2026 guidance allows generative tools and requires disclosure of where they were used. Full list:

| Tool | Where it was used |
| --- | --- |
| Arena.ai agent session with a large language model | research summarising, drafting of the documents in `docs/`, code generation for the application, and generation of the figure scripts. All scientific constants, series and residuals were checked against the published references above and against JPL Horizons output |
| `astronomia` (deterministic library) | lunar and solar position series, not generative |
| Vercel Labs `skills` CLI and the `web-design-guidelines` skill content | interface review checklist |
| Ponytail agent rules | scope discipline: no code that the product does not need |

What is not generated: every numeric result is computed at run time from the cited series, and every validation residual is produced by `npm run validate` against the committed Horizons snapshots. No imagery in this repository is synthetic. No NASA logo, flag or mission identifier is used anywhere.

## 4. How to derive a horizon profile from a real DEM

Outside this build environment, two commands produce a usable profile for any site:

```bash
# 1. crop a 60 km window around the site from the LOLA polar DEM
gdal_translate -projwin_srs "+proj=longlat +R=1737400 +no_defs" \
  -projwin LON_MIN LAT_MAX LON_MAX LAT_MIN \
  LDEM_80S_80M.IMG site_dem.tif

# 2. compute a maximum-elevation-per-azimuth profile
python3 scripts/horizon_from_dem.py site_dem.tif --lon LON --lat LAT --sectors 72 > horizon.csv
```

The profile is a two-column CSV, `azimuth, horizon elevation in degrees`, which the tool imports directly. The app label changes from "flat reference" to "imported profile" the moment one is loaded, so nobody can mistake a masked number for a geometric one.

## 5. Independence

This is an independent entry for the NASA Space Apps Challenge 2026. It is not an official NASA product and is not endorsed by NASA. Region names follow NASA's published announcement; coordinates follow the published papers named above.
