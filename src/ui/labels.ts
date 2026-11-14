import { maskIsFlat, type HorizonMask } from '../engine/site.ts'

export function horizonLabel(mask: HorizonMask): string {
  if (maskIsFlat(mask)) return 'flat reference, no terrain'
  const peak = Math.max(...mask)
  return `loaded profile, peak ${peak.toFixed(1)} degrees`
}

export function horizonMode(mask: HorizonMask): 'flat' | 'loaded' {
  return maskIsFlat(mask) ? 'flat' : 'loaded'
}
