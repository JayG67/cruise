const ROUTE_ACCESSIBLE_LABELS = {
  hierarchy: 'Operations hierarchy',
  readiness: 'Roles readiness',
  roadmap: 'Roadmap fleet',
  cutover: 'Cutover readiness',
  pilot: 'Pilot launch',
  parity: 'Parity evidence',
  handoff: 'Handoff'
}

function getRouteAccessibleLabel(route = {}) {
  return ROUTE_ACCESSIBLE_LABELS[route.key] || route.label
}

export default function ReactMigrationRouteNav({ routes = [], activeRouteKey, onSelectRoute }) {
  return (
    <nav className="react-route-nav" aria-label="React app workspace sections" data-testid="react-migration-route-nav">
      {routes.map(route => {
        const isActive = route.key === activeRouteKey
        const accessibleLabel = getRouteAccessibleLabel(route)

        return (
          <button
            key={route.key}
            type="button"
            className={isActive ? 'route-tab active' : 'route-tab'}
            aria-current={isActive ? 'page' : undefined}
            aria-pressed={isActive}
            aria-label={accessibleLabel}
            onClick={() => onSelectRoute(route.key)}
            data-testid={`react-route-${route.key}`}
          >
            <span>{route.label}</span>
            <small>{route.description}</small>
          </button>
        )
      })}
    </nav>
  )
}
