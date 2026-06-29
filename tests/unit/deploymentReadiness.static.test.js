const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('deployment readiness center static contracts', () => {
  it('exposes a live admin API and React client for deployment readiness', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const client = read('frontend/react/src/api/client.js')

    expect(routes).toContain("'/deployment/readiness'")
    expect(controller).toContain('exports.getDeploymentReadiness')
    expect(controller).toContain('buildDeploymentReadiness({')
    expect(client).toContain('getDeploymentReadiness')
    expect(client).toContain("'/cruise/deployment/readiness'")
  })

  it('keeps deployment diagnostics available as code without mounting a recruiter-facing workspace', () => {
    const app = read('frontend/react/src/App.jsx')
    const component = read('frontend/react/src/components/ReactDeploymentReadinessCenter.jsx')
    const styles = read('frontend/react/src/styles/components/readiness-centers.css')

    expect(app).not.toContain('ReactDeploymentReadinessCenter')
    expect(app).not.toContain('react-workspace-deployment-readiness-button')
    expect(component).toContain('data-testid="react-deployment-readiness-center"')
    expect(component).toContain('Deployment Readiness Center')
    expect(component).toContain('buildDeploymentActionPlan')
    expect(component).toContain('deploymentTargets')
    expect(component).toContain('releaseEvidence')
    expect(styles).toContain('.deployment-readiness-center')
    expect(styles).toContain('.deployment-readiness-gate-grid')
  })
})
