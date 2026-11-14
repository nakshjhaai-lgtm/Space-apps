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
