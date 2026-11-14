// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
  window.scrollTo = (() => {}) as typeof window.scrollTo
  // jsdom has no pointer capture and no modal dialogs; the app uses both on purpose in a real browser
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
  }
})

afterEach(cleanup)

const go = (path: string) => {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('navigation and state', () => {
  it('moves to another screen without a page load and keeps the site', () => {
    go('/?s=peak-near-shackleton')
    const link = screen.getByRole('link', { name: /^Horizon/ })
    fireEvent.click(link)
    expect(window.location.pathname).toBe('/horizon')
    expect(new URLSearchParams(window.location.search).get('s')).toBe('peak-near-shackleton')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('against the skyline')
  })

  it('marks the current destination for assistive technology', () => {
    go('/compare')
    const current = screen.getByRole('link', { current: 'page' })
    expect(current.textContent).toContain('Compare')
  })

  it('opens the command palette on Control and K, and filters to a destination', () => {
    go('/')
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const search = screen.getByRole('searchbox', { name: /search destinations/i })
    fireEvent.change(search, { target: { value: 'dates' } })
    const option = screen.getAllByRole('link', { name: /^Dates/ }).at(-1)!
    fireEvent.click(option)
    expect(window.location.pathname).toBe('/dates')
  })

  it('flips the theme and remembers it', () => {
    go('/')
    const before = document.documentElement.dataset.theme
    fireEvent.click(screen.getByRole('button', { name: /theme/i }))
    expect(document.documentElement.dataset.theme).not.toBe(before)
    expect(localStorage.getItem('theme')).toBe(document.documentElement.dataset.theme)
  })

  it('writes the horizon mask into the URL when a sector is nudged by keyboard', () => {
    go('/horizon?s=connecting-ridge')
    const sector = screen.getByRole('button', { name: /Horizon at 0 degrees/ })
    fireEvent.keyDown(sector, { key: 'ArrowUp' })
    const hz = new URLSearchParams(window.location.search).get('hz')
    expect(hz).toBeTruthy()
    expect(hz!.split(',')).toHaveLength(16)
  })

  it('drags a sector with the pointer as well as the keyboard', () => {
    go('/horizon?s=connecting-ridge')
    const band = screen.getByRole('group', { name: /Terrain horizon by compass sector/ })
    band.getBoundingClientRect = () =>
      ({ left: 0, right: 360, top: 0, bottom: 240, width: 360, height: 240, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
    // a quarter of the way across the band is the 90 degree sector; a quarter of the height up is 3 degrees
    fireEvent.pointerDown(band, { clientX: 100, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(band, { clientX: 100, clientY: 180, pointerId: 1 })
    fireEvent.pointerUp(band, { clientX: 100, clientY: 180, pointerId: 1 })
    const hz = new URLSearchParams(window.location.search).get('hz')
    expect(hz).toBeTruthy()
    expect(hz!.split(',')[4]).toBe('3')
  })
})
