import { PageHead, Panel } from '../components/primitives.tsx'
import { ROUTES } from '../components/Rail.tsx'
import { hrefFor } from '../router.ts'
import { siteById } from '../../engine/sites.ts'

export function NotFound() {
  const site = siteById(null)
  return (
    <>
      <PageHead
        title="That address is not one of the five screens"
        lede="The link may be from an older version of the tool, or the path may be mistyped. Every screen is reachable below, and the command palette opens with Control or Command and K."
      />
      <Panel title="Where you can go">
        <ul>
          {ROUTES.map((route) => (
            <li key={route.path}>
              <a href={hrefFor(route.path, { s: site.id })}>{route.label}</a>
              <span className="panel__hint"> {route.blurb}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}
