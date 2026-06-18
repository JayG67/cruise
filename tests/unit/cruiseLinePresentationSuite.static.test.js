const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('cruise line presentation suite expansion', () => {
  it('keeps the cruise-line operations workspace product-facing and operational', () => {
    const component = read('frontend/react/src/components/ReactCruiseLinePresentationSuite.jsx')

    expect(component).toContain('buildRevenueMix')
    expect(component).toContain('buildSailingCalendar')
    expect(component).toContain('buildGuestExperienceRows')
    expect(component).toContain('buildCommercialNarrative')
    expect(component).toContain('buildSailingRevenueBoard')
    expect(component).toContain('buildPortOperationsPlan')
    expect(component).toContain('buildCruiseLineClosePlan')
    expect(component).toContain('react-presentation-commercial-grid')
    expect(component).toContain('react-presentation-calendar-card')
    expect(component).toContain('react-presentation-guest-experience-card')
    expect(component).toContain('Cabin and fare mix')
    expect(component).toContain('Upcoming sailing board')
    expect(component).toContain('Guest experience handoff')
    expect(component).toContain('Sailing revenue and occupancy board')
    expect(component).toContain('Port operations plan')
    expect(component).toContain('Operational expansion path')
    expect(component).not.toContain('deployment readiness')
    expect(component).not.toContain('production readiness')
  })

  it('styles the presentation expansion without adding another readiness control panel', () => {
    const css = read('frontend/react/src/styles/app.css')

    expect(css).toContain('.presentation-commercial-grid')
    expect(css).toContain('.presentation-calendar-grid')
    expect(css).toContain('.presentation-guest-grid')
    expect(css).toContain('.presentation-operator-grid')
    expect(css).toContain('.presentation-revenue-board-row')
    expect(css).not.toContain('.presentation-readiness-panel')
  })
})
