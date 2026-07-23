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

describe('production hardening center static contracts', () => {
  it('exposes a live admin API and React client for production hardening readiness', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const client = read('frontend/react/src/api/client.js')

    expect(routes).toContain("'/production-hardening/readiness'")
    expect(controller).toContain('exports.getProductionHardeningReadiness')
    expect(controller).toContain('buildProductionHardeningReadiness({')
    expect(client).toContain('getProductionHardeningReadiness')
    expect(client).toContain("'/cruise/production-hardening/readiness'")
  })

  it('keeps production diagnostics available as code without mounting a recruiter-facing workspace', () => {
    const app = read('frontend/react/src/App.jsx')
    const component = read('frontend/react/src/components/ReactProductionHardeningCenter.jsx')
    const styles = readCssBundle('frontend/react/src/styles/components/readiness-centers.css')

    expect(app).not.toContain('ReactProductionHardeningCenter')
    expect(app).not.toContain('react-workspace-production-hardening-button')
    expect(component).toContain('data-testid="react-production-hardening-center"')
    expect(component).toContain('environment')
    expect(component).toContain('observability')
    expect(component).toContain('deployment')
    expect(component).toContain('security')
    expect(component).toContain('buildHardeningPriorityPlan')
    expect(styles).toContain('.production-hardening-center')
    expect(styles).toContain('.production-hardening-gate-grid')
  })
})
