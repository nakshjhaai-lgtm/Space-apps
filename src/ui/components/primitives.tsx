import type { ReactNode } from 'react'

export function PageHead({
  title,
  lede,
  meta,
}: {
  title: string
  lede: string
  meta?: ReactNode
}) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      <p className="page-head__lede">{lede}</p>
      {meta ? <div className="page-head__meta">{meta}</div> : null}
    </header>
  )
}

export function Readout({
  label,
  value,
  unit,
  provenance,
  tone,
}: {
  label: string
  value: string
  unit?: string
  provenance?: string
  tone?: 'sun' | 'earth' | 'blocked'
}) {
  const className = tone ? `readout readout--${tone}` : 'readout'
  return (
    <div className={className}>
      <span className="readout__label">{label}</span>
      <span className="readout__value">
        {value}
        {unit ? <span className="readout__unit">{unit}</span> : null}
      </span>
      {provenance ? <span className="readout__prov">{provenance}</span> : null}
    </div>
  )
}

export function Note({ children, warn = false }: { children: ReactNode; warn?: boolean }) {
  return <div className={warn ? 'note note--warn' : 'note'}>{children}</div>
}

export function Panel({
  title,
  hint,
  children,
  flush = false,
}: {
  title?: string
  hint?: ReactNode
  children: ReactNode
  flush?: boolean
}) {
  return (
    <section className={flush ? 'panel panel--flush' : 'panel'}>
      {title ? (
        <div className="panel__head">
          <h2>{title}</h2>
          {hint ? <span className="panel__hint">{hint}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="disclosure">
      <summary>{summary}</summary>
      <div className="disclosure__body">{children}</div>
    </details>
  )
}
