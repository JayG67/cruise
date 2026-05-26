import { useMemo, useState } from 'react'
import {
  DEFAULT_REACT_MIGRATION_ROUTE,
  getReactMigrationRoute,
  REACT_MIGRATION_ROUTES
} from '../domain/reactMigrationRoutes.js'

export function useReactMigrationRoute(initialRoute = DEFAULT_REACT_MIGRATION_ROUTE) {
  const [activeRouteKey, setActiveRouteKey] = useState(getReactMigrationRoute(initialRoute).key)

  const activeRoute = useMemo(() => getReactMigrationRoute(activeRouteKey), [activeRouteKey])

  function selectRoute(routeKey) {
    setActiveRouteKey(getReactMigrationRoute(routeKey).key)
  }

  return {
    activeRouteKey,
    activeRoute,
    routes: REACT_MIGRATION_ROUTES,
    selectRoute
  }
}
