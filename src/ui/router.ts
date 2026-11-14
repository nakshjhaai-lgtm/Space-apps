import { useEffect, useState } from 'react'

const listeners = new Set<() => void>()

const currentLocation = () => ({
  path: window.location.pathname.replace(/\/+$/, '') || '/',
  query: new URLSearchParams(window.location.search),
})

export function navigate(to: string, options: { replace?: boolean } = {}) {
  if (options.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  listeners.forEach((listener) => listener())
  if (!options.replace) window.scrollTo({ top: 0 })
}

/** Intercepts plain left clicks on same-origin links so navigation does not reload the page. */
export function useLinkInterception() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return
      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin) return
      event.preventDefault()
      navigate(`${url.pathname}${url.search}`)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}

export function useLocation() {
  const [location, setLocation] = useState(currentLocation)
  useEffect(() => {
    const update = () => setLocation(currentLocation())
    listeners.add(update)
    window.addEventListener('popstate', update)
    return () => {
      listeners.delete(update)
      window.removeEventListener('popstate', update)
    }
  }, [])
  return location
}

/** Merges parameters into the current URL without adding a history entry. */
export function setQuery(patch: Record<string, string | null>, path = window.location.pathname) {
  const query = new URLSearchParams(window.location.search)
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === '') query.delete(key)
    else query.set(key, value)
  }
  const search = query.toString()
  navigate(search ? `${path}?${search}` : path, { replace: true })
}

export function hrefFor(path: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString()
  return query ? `${path}?${query}` : path
}
