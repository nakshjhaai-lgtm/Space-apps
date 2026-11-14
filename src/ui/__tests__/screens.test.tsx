// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { App } from '../App.tsx'

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia

  class StubObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = StubObserver as unknown as typeof ResizeObserver
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']
})

afterEach(cleanup)

const go = (path: string) => {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('screens render', () => {
  it('renders the overview with a site reading', () => {
    go('/?s=connecting-ridge')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('clear the ridge')
    expect(screen.getAllByText(/Sun elevation/).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Open the horizon view' })).toBeTruthy()
  })

  it('renders the horizon view with its panorama caption and controls', () => {
    go('/horizon?s=connecting-ridge&t=2026-12-01T00:00')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('against the skyline')
    expect(screen.getByRole('img', { name: /Skyline at Connecting Ridge/ })).toBeTruthy()
    expect(screen.getByLabelText('Site')).toBeTruthy()
    expect(screen.getByLabelText('Instant')).toBeTruthy()
    expect(screen.getByLabelText('Terrain horizon by compass sector, 0 to 12 degrees')).toBeTruthy()
    expect(screen.getAllByText(/flat reference, no terrain/).length).toBeGreaterThan(0)
  })

  it('renders the comparison with every catalogue site', () => {
    go('/compare?t=2027-01-01&d=7&s=connecting-ridge')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('ranked')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(8)
    expect(screen.getByRole('button', { name: 'Export comparison as CSV' })).toBeTruthy()
  })

  it('renders the date scan', () => {
    go('/dates?s=connecting-ridge&from=2027-01-01&to=2027-02-01&nights=7')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('landing date')
    expect(screen.getAllByRole('row').length).toBeGreaterThan(3)
  })

  it('renders the model screen with residuals from the validated run', () => {
    go('/model')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('made of')
    expect(screen.getByText('Site elevation')).toBeTruthy()
    expect(screen.getByText(/not endorsed by NASA/)).toBeTruthy()
  })

  it('renders the catalogue and marks the selected site', () => {
    go('/sites?s=faustini-rim-a')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('candidate points')
    expect(screen.getAllByText('selected').length).toBe(1)
  })

  it('renders a 404 for an unknown route', () => {
    go('/nowhere')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('not one of the five screens')
  })

  it('survives nonsense parameters without throwing', () => {
    go('/horizon?s=nope&t=not-a-date&floor=999&hz=1,2,3')
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getAllByText('Connecting Ridge').length).toBeGreaterThan(0)
  })
})
