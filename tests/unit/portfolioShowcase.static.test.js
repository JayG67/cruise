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

describe('portfolio polish center static contracts', () => {
  it('exposes a live admin API and React client for portfolio showcase readiness', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const client = read('frontend/react/src/api/client.js')

    expect(routes).toContain("'/portfolio/showcase'")
    expect(controller).toContain('exports.getPortfolioShowcase')
    expect(controller).toContain('buildPortfolioShowcase({')
    expect(client).toContain('getPortfolioShowcase')
    expect(client).toContain("'/cruise/portfolio/showcase'")
  })

  it('keeps portfolio diagnostics available as code without mounting a recruiter-facing workspace', () => {
    const app = read('frontend/react/src/App.jsx')
    const component = read('frontend/react/src/components/ReactPortfolioPolishCenter.jsx')
    const styles = readCssBundle('frontend/react/src/styles/components/readiness-centers.css')

    expect(app).not.toContain('ReactPortfolioPolishCenter')
    expect(app).not.toContain('react-workspace-portfolio-polish-button')
    expect(component).toContain('data-testid="react-portfolio-polish-center"')
    expect(component).toContain('Portfolio Polish Center')
    expect(component).toContain('screenshotPlan')
    expect(component).toContain('resumeBullets')
    expect(component).toContain('interviewTalkingPoints')
    expect(component).toContain('launchChecklist')
    expect(styles).toContain('.portfolio-polish-center')
    expect(styles).toContain('.portfolio-polish-gate-grid')
  })
})
