import { useRef, useState } from 'react'
import type { HorizonMask } from '../../engine/site.ts'

const SECTORS = 16
const MAX_DEGREES = 12

export function SectorEditor({ mask, onChange }: { mask: HorizonMask; onChange: (mask: HorizonMask) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const setFromPointer = (clientX: number, clientY: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    const index = Math.min(SECTORS - 1, Math.max(0, Math.floor(((clientX - box.left) / box.width) * SECTORS)))
    const degrees = Math.max(0, Math.min(MAX_DEGREES, ((box.bottom - clientY) / box.height) * MAX_DEGREES))
    const next = [...mask]
    next[index] = Math.round(degrees * 2) / 2
    onChange(next)
  }

  return (
    <div className="sectors-wrap">
      <div
        ref={ref}
        className="sectors"
        role="group"
        aria-label="Terrain horizon by compass sector, 0 to 12 degrees"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
          setFromPointer(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (dragging) setFromPointer(event.clientX, event.clientY)
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {mask.map((value, index) => {
          const sectorAzimuth = (index * 360) / SECTORS
          return (
            <button
              key={index}
              type="button"
              className="sector"
              aria-label={`Horizon at ${Math.round(sectorAzimuth)} degrees azimuth, ${value.toFixed(1)} degrees`}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 2 : 0.5
                if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                event.preventDefault()
                const next = [...mask]
                next[index] = Math.max(0, Math.min(MAX_DEGREES, value + (event.key === 'ArrowUp' ? step : -step)))
                onChange(next)
              }}
            >
              <span
                className="sector__fill"
                style={{ height: `${(value / MAX_DEGREES) * 100}%` }}
                aria-hidden="true"
              />
              {index % 4 === 0 ? (
                <span className="sector__label" aria-hidden="true">
                  {Math.round(sectorAzimuth)}°
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="field__hint">
        Drag across the band to set the skyline, or focus a sector and use the arrow keys. Scale runs from 0 to 12
        degrees above the horizontal.
      </p>
    </div>
  )
}

export type StripState = 'both' | 'power' | 'comm' | 'none'

export function Strip({
  cells,
  onPick,
}: {
  cells: { ms: number; state: StripState }[]
  onPick: (ms: number) => void
}) {
  return (
    <div>
      <div className="strip" role="group" aria-label="Sun and Earth visibility across the window">
        {cells.map((cell) => (
          <button
            key={cell.ms}
            type="button"
            className={`strip__cell strip__cell--${cell.state}`}
            aria-label={`${new Date(cell.ms).toISOString().slice(0, 13).replace('T', ' ')} UTC, ${labelFor(cell.state)}`}
            onClick={() => onPick(cell.ms)}
          />
        ))}
      </div>
      <div className="legend" style={{ marginTop: 'var(--s-3)' }}>
        <LegendItem className="strip__cell--both" label="Power and comms" />
        <LegendItem className="strip__cell--power" label="Power only" />
        <LegendItem className="strip__cell--comm" label="Comms only" />
        <LegendItem className="strip__cell--none" label="Neither" />
      </div>
    </div>
  )
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="legend__item">
      <span className={`legend__swatch ${className}`} aria-hidden="true" />
      {label}
    </span>
  )
}

export const labelFor = (state: StripState) =>
  state === 'both'
    ? 'power and comms'
    : state === 'power'
      ? 'power only'
      : state === 'comm'
        ? 'comms only'
        : 'neither'
