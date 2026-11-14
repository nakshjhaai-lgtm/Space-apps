import { useEffect, useState } from 'react'
import { hrefFor, setQuery, useLocation } from '../router.ts'
import { siteById, formatLatitude, formatLongitude } from '../../engine/sites.ts'

export const ROUTES = [
  { path: '/', label: 'Overview', key: 'o', blurb: 'What this measures, and the reading at your site today' },
  { path: '/horizon', label: 'Horizon', key: 'h', blurb: 'Skyline, Sun and Earth tracks, terrain mask' },
  { path: '/compare', label: 'Compare', key: 'c', blurb: 'Every site over one window, ranked' },
  { path: '/dates', label: 'Dates', key: 'd', blurb: 'Candidate landing dates for one site' },
  { path: '/sites', label: 'Sites', key: 's', blurb: 'Catalogue, coordinates and sources' },
  { path: '/model', label: 'Model', key: 'm', blurb: 'Frames, validation residuals, limits' },
] as const

export function Rail() {
  const { path, query } = useLocation()
  const site = siteById(query.get('s'))
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'dark')

  useEffect(() => {
    const next = theme === 'light' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', next === 'light' ? '#f8f4ee' : '#2b2721')
  }, [theme])

  return (
    <nav className="rail" aria-label="Destinations">
      <a className="rail__mark" href={hrefFor('/', { s: site.id })}>
        <Mark />
        <span translate="no">Selenorizon</span>
      </a>

      <div className="rail__nav">
        <ul>
          {ROUTES.map((route) => (
            <li key={route.path}>
              <a
                className="rail__link"
                href={hrefFor(route.path, { s: site.id })}
                aria-current={path === route.path ? 'page' : undefined}
              >
                {route.label}
                <span className="rail__hint" aria-hidden="true">
                  g {route.key}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="rail__readout">
        <span>Site in view</span>
        <strong>{site.name}</strong>
        <span>{formatLatitude(site.latDeg)}</span>
        <span>{formatLongitude(site.lonDeg)}</span>
      </div>

      <div className="rail__foot">
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-pressed={theme === 'light'}
        >
          {theme === 'light' ? 'Use dark theme' : 'Use light theme'}
        </button>
        <span>
          Independent entry for the NASA Space Apps Challenge 2026. Not an official NASA product.
        </span>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => setQuery({ s: null })}
          aria-label="Reset site to the default"
        >
          Reset view
        </button>
      </div>
    </nav>
  )
}

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M4 46 L18 34 L28 41 L40 30 L60 41 L60 60 L4 60 Z" fill="var(--paper-3)" />
      <circle cx="42" cy="20" r="6" fill="var(--accent)" />
      <line x1="4" y1="46" x2="60" y2="46" stroke="var(--muted)" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}
