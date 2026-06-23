const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
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

  it('styles the presentation expansion without adding another readiness control panel', () => {
    const css = read('frontend/react/src/styles/app.css')

    expect(css).toContain('.presentation-control-panel')
    expect(css).toContain('.presentation-hero-card')
    expect(css).toContain('.presentation-action-grid')
    expect(css).not.toContain('.presentation-readiness-panel')
  })
})
