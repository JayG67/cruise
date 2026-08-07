const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function readCssBundle(relativePath, seen = new Set()) {
  const fullPath = path.join(projectRoot, relativePath)
  if (seen.has(fullPath)) {
    return ''
  }
  seen.add(fullPath)

  const content = fs.readFileSync(fullPath, 'utf8')
  const directory = path.dirname(relativePath)

  return content.replace(/@import\s+['"](.+?)['"];?/g, (_match, importPath) => {
    const nestedPath = path.normalize(path.join(directory, importPath)).replace(/\\/g, '/')
    return readCssBundle(nestedPath, seen)
  })
}

describe('data architecture readiness center static contracts', () => {
  it('exposes a live admin API and React client for architecture hardening readiness', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/platformReadiness.controller.js')
    const client = read('frontend/react/src/api/platformClient.js')

    expect(routes).toContain("'/data-architecture/readiness'")
    expect(controller).toContain('exports.getDataArchitectureReadiness')
    expect(controller).toContain('buildDataArchitectureReadiness({')
    expect(client).toContain('getDataArchitectureReadiness')
    expect(client).toContain("'/cruise/data-architecture/readiness'")
  })

  it('retires the unmounted standalone data-governance workspace', () => {
    const app = read('frontend/react/src/App.jsx')
    const repairScript = read('scripts/repair-repository-structure.js')
    expect(app).not.toContain('ReactDataArchitectureReadinessCenter')
    expect(app).not.toContain('react-workspace-data-architecture-button')
    expect(repairScript).toContain("'frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/readiness-data-architecture.css'")
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx'))).toBe(false)
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/components/readiness-data-architecture.css'))).toBe(false)
  })

  it('renders the actual data hardening migration backlog and risk controls', () => {
    const service = read('services/dataArchitectureReadiness.service.js')
    const staticFallback = read('frontend/react/src/api/staticFallbackReadiness.js')

    expect(service).toContain('buildMigrationBacklog')
    expect(service).toContain('buildMigrationTimeline')
    expect(service).toContain('schemaContract')
    expect(service).toContain('riskRegister')
    expect(staticFallback).toContain('migrationBacklog')
  })
})
