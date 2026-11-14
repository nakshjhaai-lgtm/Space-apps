import { useEffect, useState } from 'react'
import { useLocation } from './router.ts'
import { Rail, ROUTES } from './components/Rail.tsx'
import { CommandPalette } from './components/CommandPalette.tsx'
import { siteById } from '../engine/sites.ts'
import { Overview } from './screens/Overview.tsx'
import { Horizon } from './screens/Horizon.tsx'
import { Compare } from './screens/Compare.tsx'
import { Dates } from './screens/Dates.tsx'
import { Sites } from './screens/Sites.tsx'
import { Model } from './screens/Model.tsx'
import { NotFound } from './screens/NotFound.tsx'

const META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Selenorizon, south-pole Sun and Earth window planner',
    description:
      'Pick a candidate lunar south-pole landing site and a date. See where the Sun and Earth sit against the local skyline, for solar power and for direct-to-Earth comms.',
  },
  '/horizon': {
    title: 'Horizon view, Sun and Earth against the skyline | Selenorizon',
    description:
      'A 360 degree skyline for one south-polar site, with Sun and Earth tracks, elevation, azimuth, clearance over the terrain mask, and the occluded state.',
  },
  '/compare': {
    title: 'Compare candidate south-pole landing sites | Selenorizon',
    description:
      'Eight published south-polar sites over one window: sunlit share, Earth visibility, worst communication gap, and a published composite score.',
  },
  '/dates': {
    title: 'Candidate landing dates | Selenorizon',
    description:
      'Rank candidate landing dates for one south-polar site by sunlit share, Earth visibility and the longest communication gap.',
  },
  '/sites': {
    title: 'Site catalogue and coordinates | Selenorizon',
    description:
      'Published candidate points in the Artemis III candidate landing regions, with coordinates and the paper each coordinate comes from.',
  },
  '/model': {
    title: 'Model, residuals and limits | Selenorizon',
    description:
      'Frames, position series, lunar rotation model, accuracy against NASA JPL Horizons, and the limits of what this tool measures.',
  },
}

export function App() {
  const { path, query } = useLocation()
  const site = siteById(query.get('s'))
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [pendingG, setPendingG] = useState(false)

  useEffect(() => {
    const meta = META[path]
    if (meta) {
      document.title = meta.title
      document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    }
    const canonical = document.querySelector('link[rel="canonical"]')
    canonical?.setAttribute('href', `https://nasaspaceappschallengesubmission.netlify.app${path === '/' ? '/' : path}`)
  }, [path])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'g') {
        setPendingG(true)
        window.setTimeout(() => setPendingG(false), 1200)
        return
      }
      if (pendingG) {
        const route = ROUTES.find((r) => r.key === event.key.toLowerCase())
        if (route) {
          event.preventDefault()
          window.location.assign(`${route.path}?s=${site.id}`)
        }
        setPendingG(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingG, site.id])

  const screen = (() => {
    switch (path) {
      case '/':
        return <Overview />
      case '/horizon':
        return <Horizon />
      case '/compare':
        return <Compare />
      case '/dates':
        return <Dates />
      case '/sites':
        return <Sites />
      case '/model':
        return <Model />
      default:
        return <NotFound />
    }
  })()

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="shell">
        <Rail />
        <div className="main">
          <main className="main__inner" id="main" tabIndex={-1}>
            {screen}
          </main>
          <footer className="status">
            <span>Sun and Moon positions from published series, computed in this browser</span>
            <span aria-hidden="true">·</span>
            <span>Geometry checked against NASA JPL Horizons to 0.02 degrees</span>
            <span aria-hidden="true">·</span>
            <a href="/model">Model and limits</a>
            <span style={{ marginLeft: 'auto' }}>
              <kbd>Cmd</kbd> or <kbd>Ctrl</kbd> + <kbd>K</kbd> to jump
            </span>
          </footer>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} siteId={site.id} />
    </>
  )
}
