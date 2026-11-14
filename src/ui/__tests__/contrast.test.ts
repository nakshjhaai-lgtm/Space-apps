import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The tokens are OKLCH, so contrast cannot be eyeballed. This test converts every token pair the interface
 * actually pairs up and holds them to WCAG AA for body text, in both themes. It reads tokens.css directly, so a
 * palette change that breaks contrast fails here rather than on someone's laptop in light mode.
 */

const css = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8')

interface Oklch {
  L: number
  C: number
  h: number
}

function parseOklch(value: string): Oklch {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!match) throw new Error(`not an oklch colour: ${value}`)
  return { L: Number(match[1]), C: Number(match[2]), h: Number(match[3]) }
}

function toLinearRgb({ L, C, h }: Oklch): [number, number, number] {
  const radians = (h * Math.PI) / 180
  const a = C * Math.cos(radians)
  const b = C * Math.sin(radians)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** Relative luminance from linear-light channels, which is what OKLCH converts to; no transfer function here. */
function luminance([r, g, b]: [number, number, number]): number {
  const clamp = (channel: number) => Math.min(1, Math.max(0, channel))
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b)
}

const contrast = (a: Oklch, b: Oklch) => {
  const first = luminance(toLinearRgb(a))
  const second = luminance(toLinearRgb(b))
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

function tokensFor(theme: 'dark' | 'light') {
  const block = theme === 'dark' ? css.slice(0, css.indexOf("[data-theme='light']")) : css.slice(css.indexOf("[data-theme='light']"))
  const tokens = new Map<string, Oklch>()
  for (const line of block.split('\n')) {
    const match = line.match(/(--[a-z0-9-]+):\s*(oklch\([^)]*\))/)
    if (match) tokens.set(match[1], parseOklch(match[2]))
  }
  return tokens
}

const pairs: [string, string, string][] = [
  ['--ink', '--paper', 'body text on the page'],
  ['--ink', '--paper-2', 'body text inside a panel'],
  ['--ink-2', '--paper', 'secondary prose'],
  ['--muted', '--paper', 'labels and captions'],
  ['--accent', '--paper', 'accent text and markers'],
  ['--earth', '--paper', 'Earth colour'],
  ['--ink', '--paper-3', 'text on the inset skyline ground'],
]

describe.each(['dark', 'light'] as const)('%s theme contrast', (theme) => {
  const tokens = tokensFor(theme)

  it.each(pairs)('%s on %s meets AA for body text', (foreground, background) => {
    const fg = tokens.get(foreground)
    const bg = tokens.get(background)
    expect(fg, `${foreground} missing in ${theme}`).toBeTruthy()
    expect(bg, `${background} missing in ${theme}`).toBeTruthy()
    const ratio = contrast(fg!, bg!)
    expect(ratio, `${foreground} on ${background} in ${theme} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
  })
})

it('defines both themes', () => {
  expect(tokensFor('dark').size).toBeGreaterThan(10)
  expect(tokensFor('light').size).toBeGreaterThan(10)
})
