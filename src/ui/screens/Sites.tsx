import { PageHead, Panel, Note } from '../components/primitives.tsx'
import { useLocation, setQuery, hrefFor } from '../router.ts'
import { SITES, siteById, formatLatitude, formatLongitude } from '../../engine/sites.ts'

export function Sites() {
  const { query } = useLocation()
  const selected = siteById(query.get('s'))

  return (
    <>
      <PageHead
        title="Published candidate points at the south pole"
        lede="NASA named thirteen candidate landing regions near the lunar south pole in August 2022 and has not published a coordinate for each region. The points below come from published studies that did, and each one names its paper. They are study points inside named regions, not NASA-designated landing sites."
        meta={<span>{SITES.length} sites in the catalogue</span>}
      />

      <Panel title="Catalogue" hint="Coordinates are quoted to the precision of the source">
        <div className="site-list">
          {SITES.map((site) => {
            const isSelected = site.id === selected.id
            return (
              <article key={site.id} className="site" data-selected={isSelected}>
                <div className="site__head">
                  <h3 className="site__name">{site.name}</h3>
                  <span className="site__region">{site.region}</span>
                  {isSelected ? <span className="site__selected">selected</span> : null}
                </div>
                <p className="site__coords">
                  {formatLatitude(site.latDeg)}, {formatLongitude(site.lonDeg)}
                </p>
                <p className="site__note">{site.note}</p>
                <div className="actions">
                  <button type="button" className="btn" onClick={() => setQuery({ s: site.id })}>
                    Select this site
                  </button>
                  <a className="btn btn--quiet" href={hrefFor('/horizon', { s: site.id })}>
                    Open horizon view
                  </a>
                  <a
                    className="btn btn--quiet"
                    href={site.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {site.sourceLabel}
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </Panel>

      <Note>
        <strong>Why not one point per region?</strong> A region is roughly 15 by 15 kilometres and holds many landable
        spots with different skylines. A single coordinate would hide that. This catalogue uses the points the studies
        actually published, so the number on screen can be traced back to a paper.
      </Note>
    </>
  )
}
