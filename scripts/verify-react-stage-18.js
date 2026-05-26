const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

const packageJson = JSON.parse(read('package.json'))
const app = read('frontend/react/src/App.jsx')
const queryStatus = read('frontend/react/src/components/ReactQueryStatusPanel.jsx')
const snapshotHook = read('frontend/react/src/hooks/useAdminHierarchySnapshot.js')
const roadmap = read('frontend/react/src/domain/reactMigrationRoadmap.js')
const styles = read('frontend/react/src/styles/app.css')
const migrationPlan = read('docs/react-migration-plan.md')

const expectations = [
  [app.includes("import ReactQueryStatusPanel from './components/ReactQueryStatusPanel.jsx'"), 'App imports the React query status panel'],
  [app.includes('requestId={requestId}'), 'App passes request metadata into the query status panel'],
  [app.includes('onRefresh={reload}'), 'App wires reload into the query refresh control'],
  [queryStatus.includes('data-testid="react-query-status-panel"'), 'query status panel exposes stable test id'],
  [queryStatus.includes('data-testid="react-refresh-query"'), 'query status panel exposes refresh control'],
  [queryStatus.includes("role={error ? 'alert' : 'status'}"), 'query status panel exposes accessible status/error feedback'],
  [snapshotHook.includes('lastLoadedAt'), 'snapshot hook tracks last loaded metadata'],
  [snapshotHook.includes('requestId: reloadCount + 1'), 'snapshot hook exposes request id metadata'],
  [snapshotHook.includes('isRefreshing'), 'snapshot hook exposes refresh state'],
  [roadmap.includes('number: 18'), 'roadmap identifies Stage 18'],
  [roadmap.includes('Live API query shell'), 'roadmap names Stage 18'],
  [styles.includes('.query-status-card'), 'styles include query status card'],
  [migrationPlan.includes('Stage 18: Live API query shell'), 'migration plan documents Stage 18'],
  [packageJson.scripts['react:stage18:audit'] === 'node scripts/verify-react-stage-18.js', 'package.json exposes Stage 18 audit'],
  [packageJson.scripts['react:migration:audit'].includes('react:stage18:audit'), 'migration audit includes Stage 18']
]

const failures = expectations.filter(([passed]) => !passed)

if (failures.length > 0) {
  failures.forEach(([, message]) => console.error(`React Stage 18 audit failed: ${message}`))
  process.exit(1)
}

console.log('React Stage 18 live API query shell audit passed.')
