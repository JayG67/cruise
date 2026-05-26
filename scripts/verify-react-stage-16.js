const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const roadmap = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/reactMigrationRoadmap.js'), 'utf8')
const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
const readiness = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/MigrationReadiness.jsx'), 'utf8')
const migrationPlan = fs.readFileSync(path.join(projectRoot, 'docs/react-migration-plan.md'), 'utf8')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

const expectations = [
  [roadmap.includes('export const currentReactMigrationStage'), 'roadmap exports the current migration stage'],
  [roadmap.includes('number: 16'), 'roadmap identifies Stage 16'],
  [roadmap.includes('export const migrationReadinessPoints'), 'roadmap exports readiness points'],
  [roadmap.includes('export function getReactMigrationStageLabel'), 'roadmap exports stage label helper'],
  [app.includes("from './domain/reactMigrationRoadmap.js'"), 'App consumes shared migration roadmap metadata'],
  [app.includes('getReactMigrationStageLabel(currentReactMigrationStage)'), 'App renders the shared stage label'],
  [!app.includes('Stage 8 extracts reusable draft editor components'), 'App no longer contains stale Stage 8 hero copy'],
  [readiness.includes("from '../domain/reactMigrationRoadmap.js'"), 'MigrationReadiness consumes shared roadmap metadata'],
  [readiness.includes('migrationReadinessPoints.map'), 'MigrationReadiness renders readiness points from metadata'],
  [readiness.includes('data-testid="react-current-migration-stage"'), 'MigrationReadiness exposes a stable current-stage test hook'],
  [migrationPlan.includes('Stage 16: Migration roadmap metadata'), 'Migration plan documents Stage 16'],
  [packageJson.scripts['react:stage16:audit'] === 'node scripts/verify-react-stage-16.js', 'package.json exposes react:stage16:audit'],
  [packageJson.scripts['react:migration:audit'].includes('react:stage16:audit'), 'react:migration:audit includes Stage 16']
]

const failures = expectations.filter(([passed]) => !passed)

if (failures.length > 0) {
  failures.forEach(([, message]) => console.error(`React Stage 16 audit failed: ${message}`))
  process.exit(1)
}

console.log('React Stage 16 migration roadmap metadata audit passed.')
