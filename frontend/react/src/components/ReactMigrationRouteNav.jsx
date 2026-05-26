export default function ReactMigrationRouteNav({ routes = [], activeRouteKey, onSelectRoute }) {
  return (
    <nav className="react-route-nav" aria-label="React migration preview sections" data-testid="react-migration-route-nav">
      {routes.map(route => {
        const isActive = route.key === activeRouteKey

        return (
          <button
            key={route.key}
            type="button"
            className={isActive ? 'route-tab active' : 'route-tab'}
            aria-current={isActive ? 'page' : undefined}
            aria-pressed={isActive}
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
