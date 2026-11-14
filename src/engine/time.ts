const DAY_MS = 86_400_000
export const J2000 = 2_451_545.0
export const LUNAR_DAY_DAYS = 29.530_589

/** Julian Day from a Unix timestamp (UTC). */
export const jdFromMs = (ms: number) => ms / DAY_MS + 2_440_587.5

export const msFromJd = (jd: number) => (jd - 2_440_587.5) * DAY_MS

/**
 * TT - UT. 69 s covers 2020-2040 to within half a second, which moves the Moon
 * less than 0.3 arcsec. Shortcut: fixed offset, refine with a proper deltaT
 * series if the tool ever needs arcsecond-grade timing.
 */
const DELTA_T_S = 69
export const TT_MINUS_UTC_DAYS = DELTA_T_S / 86400

export const jdeFromMs = (ms: number) => jdFromMs(ms) + TT_MINUS_UTC_DAYS

export const msFromJde = (jde: number) => msFromJd(jde - TT_MINUS_UTC_DAYS)

export const centuriesSinceJ2000 = (jde: number) => (jde - J2000) / 36525

export const daysSinceJ2000 = (jde: number) => jde - J2000

export const daysFromMs = (ms: number) => ms / DAY_MS
