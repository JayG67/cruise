export const REACT_MIGRATION_ROUTES = [
  {
    key: 'hierarchy',
    label: 'Operations',
    description: 'Search and manage customer and booking workflows with progressive disclosure.'
  },
  {
    key: 'readiness',
    label: 'Roles',
    description: 'Review staged admin, passenger, and group-leader behavior before cutover.'
  },
  {
    key: 'roadmap',
    label: 'Fleet',
    description: 'Track remaining cruise line, ship, sailing, and itinerary parity work.'
  },
  {
    key: 'cutover',
    label: 'Quality',
    description: 'Review production-style gates before replacing any legacy DOM workflow.'
  },
  {
    key: 'pilot',
    label: 'Pilot',
    description: 'Translate remaining parity work into a dev-branch pilot launch checklist.'
  },
  {
    key: 'parity',
    label: 'Evidence',
    description: 'Compare browser, API, accessibility, and workflow evidence before cutover.'
  },
  {
    key: 'handoff',
    label: 'Handoff',
    description: 'Close the staged migration sequence and define the final review path.'
  }
]

export const DEFAULT_REACT_MIGRATION_ROUTE = 'hierarchy'

export function getReactMigrationRoute(routeKey = DEFAULT_REACT_MIGRATION_ROUTE) {
  return REACT_MIGRATION_ROUTES.find(route => route.key === routeKey) || REACT_MIGRATION_ROUTES[0]
}

export function getReactMigrationRouteKeys() {
  return REACT_MIGRATION_ROUTES.map(route => route.key)
}
