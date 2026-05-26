export const REACT_MIGRATION_ROUTES = [
  {
    key: 'hierarchy',
    label: 'Customer hierarchy',
    description: 'Exercise the highest-risk admin customer → booking workflow in React before production cutover.'
  },
  {
    key: 'readiness',
    label: 'Readiness',
    description: 'Show why this migration is being staged and how risk is controlled.'
  },
  {
    key: 'roadmap',
    label: 'Roadmap',
    description: 'Summarize migration status, completed slices, and next production-readiness checkpoints.'
  },
  {
    key: 'cutover',
    label: 'Cutover readiness',
    description: 'Review production-style gates before replacing any legacy DOM workflow.'
  },
  {
    key: 'pilot',
    label: 'Pilot launch',
    description: 'Translate the remaining migration work into a dev-branch pilot launch checklist.'
  },
  {
    key: 'parity',
    label: 'Pilot parity',
    description: 'Consolidate browser and regression evidence before the final React pilot cutover decision.'
  },
  {
    key: 'handoff',
    label: 'Final handoff',
    description: 'Close the staged migration sequence and define the final PR review and pilot cutover path.'
  }
]

export const DEFAULT_REACT_MIGRATION_ROUTE = 'hierarchy'

export function getReactMigrationRoute(routeKey = DEFAULT_REACT_MIGRATION_ROUTE) {
  return REACT_MIGRATION_ROUTES.find(route => route.key === routeKey) || REACT_MIGRATION_ROUTES[0]
}

export function getReactMigrationRouteKeys() {
  return REACT_MIGRATION_ROUTES.map(route => route.key)
}
