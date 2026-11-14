import { useEffect, useRef, useState } from 'react'
import { navigate } from '../router.ts'
import { ROUTES } from './Rail.tsx'

export function CommandPalette({ open, onClose, siteId }: { open: boolean; onClose: () => void; siteId: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const matches = ROUTES.filter((route) => route.label.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      setQuery('')
      setActive(0)
      inputRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const go = (index: number) => {
    const route = matches[index]
    if (!route) return
    navigate(`${route.path}?s=${siteId}`)
    onClose()
  }

  return (
    <dialog className="palette" ref={ref} onClose={onClose} aria-label="Go to a screen">
      <input
        ref={inputRef}
        className="palette__input"
        type="search"
        placeholder="Go to…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((current) => Math.min(matches.length - 1, current + 1))
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((current) => Math.max(0, current - 1))
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            go(active)
          }
        }}
      />
      <ul className="palette__list">
        {matches.map((route, index) => (
          <li key={route.path}>
            <a
              className="palette__item"
              href={`${route.path}?s=${siteId}`}
              data-active={index === active ? 'true' : undefined}
              onMouseEnter={() => setActive(index)}
              onClick={(event) => {
                event.preventDefault()
                go(index)
              }}
            >
              <span>{route.label}</span>
              <span className="rail__hint">{route.blurb}</span>
            </a>
          </li>
        ))}
        {matches.length === 0 ? (
          <li className="palette__item">No screen matches. Try Horizon, Compare or Model.</li>
        ) : null}
      </ul>
    </dialog>
  )
}
