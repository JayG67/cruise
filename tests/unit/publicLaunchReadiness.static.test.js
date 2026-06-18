const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('public launch readiness static contracts', () => {
  it('exposes an admin API and React client for the public launch control board', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const client = read('frontend/react/src/api/client.js')

    expect(routes).toContain("'/public-launch/readiness'")
    expect(controller).toContain('exports.getPublicLaunchReadiness')
    expect(controller).toContain('buildPublicLaunchReadiness({')
    expect(client).toContain('getPublicLaunchReadiness')
    expect(client).toContain("'/cruise/public-launch/readiness'")
  })

  it('keeps public launch diagnostics available as code without mounting a recruiter-facing workspace', () => {
    const app = read('frontend/react/src/App.jsx')
    const component = read('frontend/react/src/components/ReactPublicLaunchControlCenter.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(app).not.toContain('ReactPublicLaunchControlCenter')
    expect(app).not.toContain('react-workspace-public-launch-button')
    expect(component).toContain('data-testid="react-public-launch-control-center"')
    expect(component).toContain('Public Launch Control Center')
    expect(component).toContain('buildLaunchDecision')
    expect(component).toContain('react-public-launch-critical-items')
    expect(component).toContain('react-project-status-panel')
    expect(styles).toContain('.public-launch-control-center')
    expect(styles).toContain('.public-launch-track-grid')
  })
})
