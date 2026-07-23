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

function optionalRead(relativePath) {
  const fullPath = path.join(projectRoot, relativePath)
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : ''
}

describe('cruise line presentation suite expansion', () => {
  it('keeps the cruise-line operations workspace product-facing and operational', () => {
    const component = read('frontend/react/src/components/ReactCruiseLinePresentationSuite.jsx')

    expect(component).toContain('react-presentation-line-picker')
    expect(component).toContain('presentation-hero-card')
    expect(component).toContain('Cruise line operating workspace')
    expect(component).toContain('Cruise line operating actions')
    expect(component).toContain('Open fleet details')
    expect(component).toContain('Open passenger views')
    expect(component).toContain('Open turnaround setup')
    expect(component).not.toContain('react-presentation-calendar-grid')
    expect(component).not.toContain('react-presentation-operator-grid')
    expect(component).not.toContain('react-presentation-calendar-card')
    expect(component).not.toContain('react-presentation-guest-experience-card')
    expect(component).not.toContain('react-presentation-revenue-board-card')
    expect(component).not.toContain('react-presentation-port-plan-card')
    expect(component).not.toContain('react-presentation-close-plan-card')
    expect(component).not.toContain('Upcoming sailing board')
    expect(component).not.toContain('Guest experience handoff')
    expect(component).not.toContain('Sailing revenue and occupancy board')
    expect(component).not.toContain('Port operations plan')
    expect(component).not.toContain('Operational expansion path')
    expect(component).not.toContain('Route and port footprint')
    expect(component).not.toContain('Manifest preview')
    expect(component).not.toContain('Onboard and shore programming')
    expect(component).not.toContain('Operational picture')
    expect(component).not.toContain('Cabin and fare mix')
    expect(component).not.toContain('Operating sequence')
    expect(component).not.toContain('Featured sailing')
    expect(component).not.toContain('react-presentation-itinerary-card')
    expect(component).not.toContain('presentation-detail-grid')
    expect(component).not.toContain('itinerary-strip')
    expect(component).not.toContain('deployment readiness')
    expect(component).not.toContain('production readiness')
  })

  it('styles the presentation expansion through the shared design system', () => {
    const productShellCss = readCssBundle('frontend/react/src/styles/components/product-shell.css')
    const componentIndexCss = read('frontend/react/src/styles/components/index.css')
    const legacyCss = optionalRead('frontend/react/src/styles/app.css')

    expect(componentIndexCss).toContain("@import './product-shell.css';")
    expect(productShellCss).toContain('.presentation-control-panel')
    expect(productShellCss).toContain('.presentation-hero-card')
    expect(productShellCss).toContain('.presentation-action-grid')
    expect(productShellCss).not.toContain('.presentation-readiness-panel')
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'))).toBe(false)
    expect(legacyCss).not.toContain('.presentation-demo-flow')
    expect(legacyCss).not.toContain('.presentation-commercial-grid')
    expect(legacyCss).not.toContain('.presentation-operator-grid')
    expect(legacyCss).not.toContain('.operations-presentation-guide')
  })
})
