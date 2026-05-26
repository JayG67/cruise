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
const cutoverDomain = read('frontend/react/src/domain/reactCutoverReadiness.js')
const cutoverPanel = read('frontend/react/src/components/ReactCutoverReadinessPanel.jsx')
const roadmap = read('frontend/react/src/domain/reactMigrationRoadmap.js')
const styles = read('frontend/react/src/styles/app.css')
const plan = read('docs/react-migration-plan.md')

assertContains(app, "import ReactCutoverReadinessPanel from './components/ReactCutoverReadinessPanel.jsx'", 'App')
assertContains(app, "activeRouteKey === 'cutover'", 'App')
assertContains(routes, "key: 'cutover'", 'React routes')
assertContains(cutoverDomain, 'reactCutoverReadinessGates', 'Cutover domain')
assertContains(cutoverDomain, 'summarizeReactCutoverReadiness', 'Cutover domain')
assertContains(cutoverDomain, 'getReactCutoverRecommendation', 'Cutover domain')
assertContains(cutoverPanel, 'data-testid="react-cutover-readiness-panel"', 'Cutover panel')
assertContains(cutoverPanel, 'data-testid="react-cutover-gates"', 'Cutover panel')
assertContains(roadmap, "number: 19", 'Roadmap')
assertContains(styles, '.cutover-gate-grid', 'React styles')
assertContains(plan, 'Stage 19: Cutover readiness gates', 'Migration plan')

if (packageJson.scripts['react:stage19:audit'] !== 'node scripts/verify-react-stage-19.js') {
  throw new Error('package.json must expose react:stage19:audit')
}

if (!packageJson.scripts['react:migration:audit'].includes('react:stage19:audit')) {
  throw new Error('react:migration:audit must include stage 19')
}

console.log('React Stage 19 cutover readiness audit passed.')
