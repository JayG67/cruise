const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('data architecture readiness center static contracts', () => {
  it('exposes a live admin API and React client for architecture hardening readiness', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const client = read('frontend/react/src/api/client.js')

    expect(routes).toContain("'/data-architecture/readiness'")
    expect(controller).toContain('exports.getDataArchitectureReadiness')
    expect(controller).toContain('buildDataArchitectureReadiness({')
    expect(client).toContain('getDataArchitectureReadiness')
    expect(client).toContain("'/cruise/data-architecture/readiness'")
  })

  it('keeps architecture diagnostics available as code without mounting a recruiter-facing workspace', () => {
    const app = read('frontend/react/src/App.jsx')
    const component = read('frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(app).not.toContain('ReactDataArchitectureReadinessCenter')
    expect(app).not.toContain('react-workspace-data-architecture-button')
    expect(component).toContain('data-testid="react-data-architecture-readiness-center"')
    expect(component).toContain('identity')
    expect(component).toContain('timestamp')
    expect(component).toContain('tenant-boundary')
    expect(component).toContain('buildPriorityPlan')
    expect(styles).toContain('.data-architecture-readiness-center')
    expect(styles).toContain('.data-architecture-gate-grid')
  })

  it('renders the actual data hardening migration backlog and risk controls', () => {
    const service = read('services/dataArchitectureReadiness.service.js')
    const component = read('frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx')
    const client = read('frontend/react/src/api/client.js')
    const styles = read('frontend/react/src/styles/app.css')

    expect(service).toContain('buildMigrationBacklog')
    expect(service).toContain('buildMigrationTimeline')
    expect(service).toContain('schemaContract')
    expect(service).toContain('riskRegister')
    expect(component).toContain('data-testid="react-data-architecture-migration-board"')
    expect(component).toContain('data-testid="react-data-architecture-timeline"')
    expect(component).toContain('data-testid="react-data-architecture-risk-register"')
    expect(client).toContain('migrationBacklog')
    expect(styles).toContain('.data-architecture-migration-board')
    expect(styles).toContain('.data-architecture-risk-register')
  })
})
