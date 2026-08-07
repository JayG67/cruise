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

describe('deployment readiness center static contracts', () => {
  it('exposes a live admin API and React client for deployment readiness', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/platformReadiness.controller.js')
    const client = read('frontend/react/src/api/platformClient.js')

    expect(routes).toContain("'/deployment/readiness'")
    expect(controller).toContain('exports.getDeploymentReadiness')
    expect(controller).toContain('buildDeploymentReadiness({')
    expect(client).toContain('getDeploymentReadiness')
    expect(client).toContain("'/cruise/deployment/readiness'")
  })

  it('retires the unmounted standalone readiness workspace', () => {
    const app = read('frontend/react/src/App.jsx')
    const repairScript = read('scripts/repair-repository-structure.js')
    expect(app).not.toContain('ReactDeploymentReadinessCenter')
    expect(app).not.toContain('react-workspace-deployment-readiness-button')
    expect(repairScript).toContain("'frontend/react/src/components/ReactDeploymentReadinessCenter.jsx'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/readiness-deployment.css'")
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/components/ReactDeploymentReadinessCenter.jsx'))).toBe(false)
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/components/readiness-deployment.css'))).toBe(false)
  })
})
