# Demo video

Official limit: 30 seconds if a video is used instead of the 7-slide deck (2026 submission guidance). Record at 1080p, 30 fps, no music, narration only. English, with burned-in captions so it works muted.

## 30 second cut, shot by shot

| Time | Shot | Narration |
| --- | --- | --- |
| 0:00 to 0:04 | Horizon screen, panorama filling the frame, Sun marker near the ridge, Earth marker on the other side | "At the lunar south pole, the Sun and the Earth both sit within a few degrees of the horizon." |
| 0:04 to 0:09 | Cursor drags the horizon sector handles upward; the Sun marker turns to `occluded` in step | "A ridge decides whether a site gets power. Here the skyline is an input you can see and change." |
| 0:09 to 0:14 | Readouts: elevation, azimuth, horizon, clearance, with the provenance line | "Every reading states its own model: flat reference, edited mask, or imported profile." |
| 0:14 to 0:21 | Compare screen; sort by score; row highlight moves | "Eight published candidate regions, one window, ranked by sunlit share, Earth visibility, and the worst communication gap." |
| 0:21 to 0:26 | Model screen, accuracy table scrolled to the residual row | "The geometry is checked against NASA JPL Horizons, and the residuals are published in the app." |
| 0:26 to 0:30 | Overview screen with the site reading and both actions | "Pick a region. Pick a date. See the window." |

Word count 78, which lands near 155 words per minute with the pauses above. Read it slowly; do not add words.

## Recording recipe

1. `npm run build && npm run preview`, open `http://localhost:4173` at 1440 by 900, browser zoom 100 percent, dark theme.
2. Hide the bookmark bar. No cursor smoothing, no zooms, no transitions faster than a user could follow.
3. Set the horizon to `connecting-ridge`, instant 2026-12-01T00:00Z before recording so the first frame is meaningful.
4. Record each shot separately, then cut. One take per shot keeps the timing honest.
5. Captions: burn them in. Judges may watch muted.

## Optional 3 minute walkthrough (for the repository only)

1. Problem, thirty seconds: the geometry of the pole, why a ridge matters.
2. Horizon screen, sixty seconds: panorama reading order, masks, disc fraction, the strip.
3. Compare screen, forty five seconds: what each column means, why the score subtracts the longest gap.
4. Model screen, thirty seconds: frames, validation, limits.
5. Close, fifteen seconds: one region, one date, one window.

## What must not appear in the video

- No NASA logo, flag or mission identifier.
- No claim that NASA endorses or uses the tool.
- No unlabelled footage of a different product.
