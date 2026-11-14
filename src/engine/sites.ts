export interface Site {
  id: string
  name: string
  region: string
  /** Degrees, negative south. */
  latDeg: number
  /** Degrees, east positive. */
  lonDeg: number
  sourceLabel: string
  sourceUrl: string
  note: string
}

/**
 * Published candidate points at the lunar south pole. Every coordinate is
 * transcribed from the paper named on the entry and is shown with its source in
 * the interface. These are published study points, not NASA-designated landing
 * sites.
 */
export const SITES: Site[] = [
  {
    id: 'connecting-ridge',
    name: 'Connecting Ridge',
    region: 'Artemis III candidate region',
    latDeg: -89.53432,
    lonDeg: 209.94767,
    sourceLabel: 'LPSC 2024, abstract 1695',
    sourceUrl: 'https://www.hou.usra.edu/meetings/lpsc2024/pdf/1695.pdf',
    note: 'Ridge joining Shackleton and de Gerlache, the closest candidate region to the pole and the strongest published illumination case.',
  },
  {
    id: 'peak-near-shackleton',
    name: 'Peak Near Shackleton',
    region: 'Artemis III candidate region',
    latDeg: -89.01701,
    lonDeg: 126.27302,
    sourceLabel: 'LPSC 2024, abstract 1695',
    sourceUrl: 'https://www.hou.usra.edu/meetings/lpsc2024/pdf/1695.pdf',
    note: 'High ground on the Shackleton rim, with access to volatile-bearing permanently shadowed terrain.',
  },
  {
    id: 'peak-near-shackleton-south',
    name: 'Peak Near Shackleton, south spur',
    region: 'Artemis III candidate region',
    latDeg: -88.969,
    lonDeg: 134.106,
    sourceLabel: 'Wueller et al. 2026, JGR Planets',
    sourceUrl: 'https://doi.org/10.1029/2025JE009434',
    note: 'One of the study points that satisfies the Human Landing System constraints inside this region.',
  },
  {
    id: 'faustini-rim-a',
    name: 'Faustini Rim A',
    region: 'Artemis III candidate region',
    latDeg: -88.098,
    lonDeg: 89.782,
    sourceLabel: 'Wueller et al. 2026, JGR Planets',
    sourceUrl: 'https://doi.org/10.1029/2025JE009434',
    note: 'Rim of Faustini, the largest candidate region by landable area, adjacent to a large cold trap.',
  },
  {
    id: 'de-gerlache-rim-2',
    name: 'de Gerlache Rim 2',
    region: 'Artemis III candidate region',
    latDeg: -88.065,
    lonDeg: -62.074,
    sourceLabel: 'Wueller et al. 2026, JGR Planets',
    sourceUrl: 'https://doi.org/10.1029/2025JE009434',
    note: 'Western rim of de Gerlache, cited for accessible ice-bearing shadowed ground within a short traverse.',
  },
  {
    id: 'nobile-rim-2',
    name: 'Nobile Rim 2',
    region: 'Artemis III candidate region',
    latDeg: -84.074,
    lonDeg: 59.197,
    sourceLabel: 'Wueller et al. 2026, JGR Planets',
    sourceUrl: 'https://doi.org/10.1029/2025JE009434',
    note: 'Furthest from the pole in this catalogue, so the Sun climbs higher and the night is shorter.',
  },
  {
    id: 'peak-near-cabeus-b',
    name: 'Peak Near Cabeus B',
    region: 'Artemis III candidate region',
    latDeg: -83.563,
    lonDeg: -68.201,
    sourceLabel: 'Wueller et al. 2026, JGR Planets',
    sourceUrl: 'https://doi.org/10.1029/2025JE009434',
    note: 'Massif between Cabeus and the pole, studied for line-of-sight to volatile-rich terrain.',
  },
  {
    id: 'amundsen-rim',
    name: 'Amundsen Rim',
    region: 'Artemis III candidate region',
    latDeg: -84.19184,
    lonDeg: 67.22904,
    sourceLabel: 'arXiv:2406.19863, multi-criteria study',
    sourceUrl: 'https://arxiv.org/abs/2406.19863',
    note: 'Rim of Amundsen, scored highly in a published multi-criteria comparison for power and communications.',
  },
]

export const DEFAULT_SITE_ID = 'connecting-ridge'

export const siteById = (id: string | null | undefined): Site =>
  SITES.find((s) => s.id === id) ?? SITES.find((s) => s.id === DEFAULT_SITE_ID) ?? SITES[0]

export const formatLatitude = (lat: number) => `${Math.abs(lat).toFixed(3)}\u00a0deg south`
export const formatLongitude = (lon: number) => {
  const wrapped = ((lon % 360) + 540) % 360 - 180
  const hemisphere = wrapped >= 0 ? 'east' : 'west'
  return `${Math.abs(wrapped).toFixed(3)}\u00a0deg ${hemisphere}`
}
