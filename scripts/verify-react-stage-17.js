const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

const packageJson = JSON.parse(read('package.json'))
const routes = read('frontend/react/src/domain/reactMigrationRoutes.js')
const routeHook = read('frontend/react/src/hooks/useReactMigrationRoute.js')
const routeNav = read('frontend/react/src/components/ReactMigrationRouteNav.jsx')
const roadmapPanel = read('frontend/react/src/components/MigrationRoadmapPanel.jsx')
const app = read('frontend/react/src/App.jsx')
const roadmap = read('frontend/react/src/domain/reactMigrationRoadmap.js')
const styles = read('frontend/react/src/styles/app.css')
const migrationPlan = read('docs/react-migration-plan.md')

const expectations = [
  [routes.includes('export const REACT_MIGRATION_ROUTES'), 'routes domain exports route list'],
  [routes.includes("key: 'hierarchy'"), 'routes domain includes hierarchy route'],
  [routes.includes("key: 'readiness'"), 'routes domain includes readiness route'],
  [routes.includes("key: 'roadmap'"), 'routes domain includes roadmap route'],
  [routeHook.includes('export function useReactMigrationRoute'), 'route hook is exported'],
  [routeHook.includes('useState(getReactMigrationRoute(initialRoute).key)'), 'route hook owns active route state'],
  [routeNav.includes('data-testid="react-migration-route-nav"'), 'route nav exposes stable test id'],
  [routeNav.includes('aria-current={isActive ? \'page\' : undefined}'), 'route nav marks active route accessibly'],
  [roadmapPanel.includes('data-testid="react-migration-roadmap-panel"'), 'roadmap panel exposes stable test id'],
  [roadmapPanel.includes('getReactMigrationRouteKeys'), 'roadmap panel summarizes preview route coverage'],
  [app.includes("import ReactMigrationRouteNav from './components/ReactMigrationRouteNav.jsx'"), 'App imports route nav'],
  [app.includes("import { useReactMigrationRoute } from './hooks/useReactMigrationRoute.js'"), 'App imports route hook'],
  [app.includes("activeRouteKey === 'hierarchy'"), 'App routes hierarchy panel conditionally'],
  [app.includes("activeRouteKey === 'readiness'"), 'App routes readiness panel conditionally'],
  [app.includes("activeRouteKey === 'roadmap'"), 'App routes roadmap panel conditionally'],
  [roadmap.includes('number: 17'), 'roadmap identifies Stage 17'],
  [roadmap.includes('Route-level preview shell'), 'roadmap names Stage 17'],
  [styles.includes('.react-route-nav'), 'styles include route navigation'],
  [styles.includes('.roadmap-card'), 'styles include roadmap card'],
  [migrationPlan.includes('Stage 17: Route-level preview shell'), 'migration plan documents Stage 17'],
  [packageJson.scripts['react:stage17:audit'] === 'node scripts/verify-react-stage-17.js', 'package.json exposes Stage 17 audit'],
  [packageJson.scripts['react:migration:audit'].includes('react:stage17:audit'), 'migration audit includes Stage 17']
]

const failures = expectations.filter(([passed]) => !passed)

if (failures.length > 0) {
  failures.forEach(([, message]) => console.error(`React Stage 17 audit failed: ${message}`))
  process.exit(1)
}

console.log('React Stage 17 route-level preview shell audit passed.')
