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
const pilotDomain = read('frontend/react/src/domain/reactPilotLaunch.js')
const pilotPanel = read('frontend/react/src/components/ReactPilotLaunchPanel.jsx')
const roadmap = read('frontend/react/src/domain/reactMigrationRoadmap.js')
const styles = read('frontend/react/src/styles/app.css')
const plan = read('docs/react-migration-plan.md')

assertContains(app, "import ReactPilotLaunchPanel from './components/ReactPilotLaunchPanel.jsx'", 'App')
assertContains(app, "activeRouteKey === 'pilot'", 'App')
assertContains(routes, "key: 'pilot'", 'React routes')
assertContains(pilotDomain, 'reactPilotLaunchSteps', 'Pilot launch domain')
assertContains(pilotDomain, 'summarizeReactPilotLaunch', 'Pilot launch domain')
assertContains(pilotDomain, 'getReactPilotLaunchRecommendation', 'Pilot launch domain')
assertContains(pilotPanel, 'data-testid="react-pilot-launch-panel"', 'Pilot launch panel')
assertContains(pilotPanel, 'data-testid="react-pilot-steps"', 'Pilot launch panel')
assertContains(roadmap, 'number: 20', 'Roadmap')
assertContains(roadmap, 'Pilot launch checklist', 'Roadmap')
assertContains(styles, '.pilot-step-list', 'React styles')
assertContains(plan, 'Stage 20: Pilot launch checklist', 'Migration plan')

if (packageJson.scripts['react:stage20:audit'] !== 'node scripts/verify-react-stage-20.js') {
  throw new Error('package.json must expose react:stage20:audit')
}

if (!packageJson.scripts['react:migration:audit'].includes('react:stage20:audit')) {
  throw new Error('react:migration:audit must include Stage 20 audit')
}

console.log('React Stage 20 pilot launch audit passed.')
