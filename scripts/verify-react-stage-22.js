const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertContains(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} must contain: ${expected}`)
  }
}

const app = read('frontend/react/src/App.jsx')
const routes = read('frontend/react/src/domain/reactMigrationRoutes.js')
const handoffDomain = read('frontend/react/src/domain/reactMigrationHandoff.js')
const handoffPanel = read('frontend/react/src/components/ReactMigrationHandoffPanel.jsx')
const roadmap = read('frontend/react/src/domain/reactMigrationRoadmap.js')
const styles = read('frontend/react/src/styles/app.css')
const plan = read('docs/react-migration-plan.md')

assertContains(app, "import ReactMigrationHandoffPanel from './components/ReactMigrationHandoffPanel.jsx'", 'App')
assertContains(app, "activeRouteKey === 'handoff'", 'App')
assertContains(routes, "key: 'handoff'", 'React routes')
assertContains(handoffDomain, 'reactMigrationHandoffItems', 'Migration handoff domain')
assertContains(handoffDomain, 'summarizeReactMigrationHandoff', 'Migration handoff domain')
assertContains(handoffDomain, 'getReactMigrationHandoffRecommendation', 'Migration handoff domain')
assertContains(handoffPanel, 'data-testid="react-migration-handoff-panel"', 'Migration handoff panel')
assertContains(handoffPanel, 'data-testid="react-handoff-items"', 'Migration handoff panel')
assertContains(roadmap, 'number: 22', 'Roadmap')
assertContains(roadmap, 'Final migration handoff', 'Roadmap')
assertContains(styles, '.handoff-item-list', 'React styles')
assertContains(plan, 'Stage 22: Final migration handoff', 'Migration plan')
assertContains(plan, 'After Stage 22, stop adding migration stage numbers by default', 'Migration plan')

if (packageJson.scripts['react:stage22:audit'] !== 'node scripts/verify-react-stage-22.js') {
  throw new Error('package.json must expose react:stage22:audit')
}

if (!packageJson.scripts['react:migration:audit'].includes('react:stage22:audit')) {
  throw new Error('react:migration:audit must include Stage 22 audit')
}

console.log('React Stage 22 final migration handoff audit passed.')
