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
const parityDomain = read('frontend/react/src/domain/reactPilotParity.js')
const parityPanel = read('frontend/react/src/components/ReactPilotParityPanel.jsx')
const roadmap = read('frontend/react/src/domain/reactMigrationRoadmap.js')
const styles = read('frontend/react/src/styles/app.css')
const plan = read('docs/react-migration-plan.md')

assertContains(app, "import ReactPilotParityPanel from './components/ReactPilotParityPanel.jsx'", 'App')
assertContains(app, "activeRouteKey === 'parity'", 'App')
assertContains(routes, "key: 'parity'", 'React routes')
assertContains(parityDomain, 'reactPilotParityChecks', 'Pilot parity domain')
assertContains(parityDomain, 'summarizeReactPilotParity', 'Pilot parity domain')
assertContains(parityDomain, 'getReactPilotParityRecommendation', 'Pilot parity domain')
assertContains(parityPanel, 'data-testid="react-pilot-parity-panel"', 'Pilot parity panel')
assertContains(parityPanel, 'data-testid="react-parity-checks"', 'Pilot parity panel')
assertContains(roadmap, 'number: 21', 'Roadmap')
assertContains(roadmap, 'Pilot parity evidence', 'Roadmap')
assertContains(styles, '.parity-check-list', 'React styles')
assertContains(plan, 'Stage 21: Pilot parity evidence', 'Migration plan')

if (packageJson.scripts['react:stage21:audit'] !== 'node scripts/verify-react-stage-21.js') {
  throw new Error('package.json must expose react:stage21:audit')
}

if (!packageJson.scripts['react:migration:audit'].includes('react:stage21:audit')) {
  throw new Error('react:migration:audit must include Stage 21 audit')
}

console.log('React Stage 21 pilot parity audit passed.')
