import { useEffect, useRef } from 'react'
import { horizonAt, type HorizonMask } from '../../engine/site.ts'

export interface SkyTrackPoint {
  azimuth: number
  elevation: number
}

interface PanoramaProps {
  sunTrack: SkyTrackPoint[]
  earthTrack: SkyTrackPoint[]
  sun: { azimuth: number; elevation: number; blocked: boolean }
  earth: { azimuth: number; elevation: number; blocked: boolean }
  mask: HorizonMask
  caption: string
}

const EL_MIN = -12
const EL_MAX = 12
const PAD = { left: 40, right: 18, top: 18, bottom: 30 }

export function Panorama({ sunTrack, earthTrack, sun, earth, mask, caption }: PanoramaProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const paint = () => draw(canvas, { sunTrack, earthTrack, sun, earth, mask })
    paint()
    const observer = new ResizeObserver(paint)
    observer.observe(canvas)
    const media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', paint)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', paint)
    }
  }, [sunTrack, earthTrack, sun, earth, mask])

  return (
    <figure className="panorama" style={{ margin: 0 }}>
      <canvas ref={ref} role="img" aria-label={caption} />
    </figure>
  )
}

function draw(canvas: HTMLCanvasElement, props: Omit<PanoramaProps, 'caption'>) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const style = getComputedStyle(canvas)
  const token = (name: string) => style.getPropertyValue(name).trim()

  const paper = token('--paper') || '#1d1915'
  const ground = token('--paper-3') || '#3a342d'
  const rule = token('--rule') || '#4a4238'
  const muted = token('--muted') || '#a2988a'
  const ink = token('--ink') || '#f2ece3'
  const accent = token('--accent') || '#e8b33c'
  const earthColor = token('--earth') || '#7fa8c9'
  const danger = token('--danger') || '#e0736a'

  const w = rect.width
  const h = rect.height
  const plotW = Math.max(10, w - PAD.left - PAD.right)
  const plotH = Math.max(10, h - PAD.top - PAD.bottom)
  const x = (az: number) => PAD.left + (az / 360) * plotW
  const y = (el: number) => PAD.top + ((EL_MAX - el) / (EL_MAX - EL_MIN)) * plotH

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, w, h)

  // skyline silhouette
  ctx.beginPath()
  ctx.moveTo(x(0), h - PAD.bottom)
  for (let az = 0; az <= 360; az += 1) {
    const el = horizonAt(props.mask, az)
    ctx.lineTo(x(az), y(Math.max(EL_MIN, Math.min(EL_MAX, el))))
  }
  ctx.lineTo(x(360), h - PAD.bottom)
  ctx.closePath()
  ctx.fillStyle = ground
  ctx.fill()
  ctx.strokeStyle = muted
  ctx.lineWidth = 1.4
  ctx.beginPath()
  for (let az = 0; az <= 360; az += 1) {
    const el = horizonAt(props.mask, az)
    const px = x(az)
    const py = y(Math.max(EL_MIN, Math.min(EL_MAX, el)))
    if (az === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // elevation grid
  ctx.font = '11px "IBM Plex Sans", sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const el of [-10, -5, 0, 5, 10]) {
    ctx.strokeStyle = el === 0 ? rule : 'rgba(128,128,128,0.16)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD.left, y(el) + 0.5)
    ctx.lineTo(w - PAD.right, y(el) + 0.5)
    ctx.stroke()
    ctx.fillStyle = muted
    ctx.fillText(`${el > 0 ? '+' : ''}${el}°`, PAD.left - 6, y(el))
  }

  // azimuth ticks
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let az = 0; az <= 360; az += 45) {
    ctx.strokeStyle = 'rgba(128,128,128,0.16)'
    ctx.beginPath()
    ctx.moveTo(x(az) + 0.5, PAD.top)
    ctx.lineTo(x(az) + 0.5, h - PAD.bottom)
    ctx.stroke()
    ctx.fillStyle = muted
    ctx.fillText(`${az}°`, x(az), h - PAD.bottom + 6)
  }

  // tracks
  const line = (points: SkyTrackPoint[], color: string, dashed: boolean) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 1.6
    ctx.setLineDash(dashed ? [4, 4] : [])
    ctx.beginPath()
    let started = false
    for (const p of points) {
      const px = x(p.azimuth)
      const py = y(Math.max(EL_MIN, Math.min(EL_MAX, p.elevation)))
      if (!started) {
        ctx.moveTo(px, py)
        started = true
      } else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.setLineDash([])
  }
  line(props.earthTrack, earthColor, true)
  line(props.sunTrack, accent, false)

  // markers
  const marker = (az: number, el: number, color: string, label: string, blocked: boolean) => {
    const px = x(az)
    const py = y(Math.max(EL_MIN, Math.min(EL_MAX, el)))
    ctx.beginPath()
    ctx.arc(px, py, 6.5, 0, Math.PI * 2)
    ctx.fillStyle = blocked ? paper : color
    ctx.fill()
    ctx.strokeStyle = blocked ? danger : color
    ctx.lineWidth = 1.8
    ctx.stroke()
    if (blocked) {
      ctx.beginPath()
      ctx.moveTo(px - 4, py - 4)
      ctx.lineTo(px + 4, py + 4)
      ctx.moveTo(px + 4, py - 4)
      ctx.lineTo(px - 4, py + 4)
      ctx.strokeStyle = danger
      ctx.lineWidth = 1.4
      ctx.stroke()
    }
    const text = blocked ? `${label} occluded` : label
    ctx.font = '11px "IBM Plex Sans", sans-serif'
    ctx.textAlign = px > w - 120 ? 'right' : 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = blocked ? danger : ink
    ctx.fillText(text, px > w - 120 ? px - 10 : px + 10, py - 6)
  }

  marker(props.sun.azimuth, props.sun.elevation, accent, 'Sun', props.sun.blocked)
  marker(props.earth.azimuth, props.earth.elevation, earthColor, 'Earth', props.earth.blocked)
}
