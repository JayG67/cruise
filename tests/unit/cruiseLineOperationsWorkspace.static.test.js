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

describe('cruise line operations workspace', () => {
  it('keeps the cruise-line operations workspace product-facing and operational', () => {
    const component = read('frontend/react/src/components/ReactCruiseLineOperationsWorkspace.jsx')
    const domain = read('frontend/react/src/domain/cruiseLineOperations.js')
    const operationsData = read('frontend/react/src/domain/cruiseLineOperationsData.js')
    const selectionBridge = read('frontend/react/src/hooks/useDemoSelectionBridge.js')
    const itineraryHook = read('frontend/react/src/hooks/useAuthoritativeSailingItinerary.js')

    expect(component).toContain('react-presentation-line-picker')
    expect(component).toContain('presentation-hero-card')
    expect(component).toContain('Cruise line operating workspace')
    expect(component).toContain('Cruise line operating actions')
    expect(component).toContain('react-cruise-line-selected-scope')
    expect(component).toContain('Selected sailing workspace')
    expect(component).toContain('Open selected sailing workspace')
    expect(component).toContain('buildSelectedOperatingScope')
    expect(component).toContain('useAuthoritativeSailingItinerary')
    expect(component).toContain('authoritativeItinerary')
    expect(itineraryHook).toContain('getItineraryForSailing')
    expect(itineraryHook).toContain('getShipsForCruiseLine')
    expect(itineraryHook).toContain('getSailingsForShip')
    expect(itineraryHook).toContain('hasPersistentId(cruiseLineId)')
    expect(itineraryHook).toContain('ship.name === shipName')
    expect(itineraryHook).toContain('sailing.departureDate === departureDate')
    expect(operationsData).toContain('function getLineId')
    expect(operationsData).toContain("return line?.id || line?.name || 'cruise-line'")
    expect(component).toContain('cruiseLineId: getLineId(selectedLine || {})')
    expect(operationsData).toContain('function buildSelectedOperatingScope')
    expect(operationsData).toContain('Array.isArray(authoritativeItinerary)')
    expect(operationsData).toContain('Array.isArray(authoritativeItinerary) && itinerary.length')
    expect(operationsData).toContain("line = line && typeof line === 'object' ? line : {}")
    expect(operationsData).toContain('bookings = Array.isArray(bookings) ? bookings : []')
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
    expect(component).toContain('getOperationalShips')
    expect(domain).toContain('getOperationalShips')
    expect(operationsData).toContain('function getOperationalShips')
    expect(domain).not.toContain('getPresentationShips')
    expect(selectionBridge).toContain('No matching assigned person found.')
    expect(selectionBridge).not.toContain('No matching demo user found.')
  })

  it('keeps the wide operating workspace compact instead of stacking sparse full-width cards', () => {
    const componentIndexCss = read('frontend/react/src/styles/components/index.css')
    const densityCss = read('frontend/react/src/styles/components/cruise-line-operations-density.css')

    expect(componentIndexCss).toContain("@import './cruise-line-operations-density.css';")
    expect(densityCss).toContain('grid-template-columns: repeat(6, minmax(0, 1fr)) !important;')
    expect(densityCss).toContain('grid-template-columns: repeat(4, minmax(0, 1fr)) !important;')
    expect(densityCss).toContain('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;')
    expect(densityCss).toContain('grid-template-columns: 1fr !important;')
    expect(densityCss).toContain('min-height: 0 !important;')
  })

  it('styles the operations workspace through the shared design system', () => {
    const productShellCss = readCssBundle('frontend/react/src/styles/components/product-shell.css')
    const componentIndexCss = read('frontend/react/src/styles/components/index.css')
    const operationsAggregateCss = read('frontend/react/src/styles/components/cruise-line-operations.css')
    const legacyCss = optionalRead('frontend/react/src/styles/app.css')

    expect(componentIndexCss).toContain("@import './product-shell.css';")
    expect(productShellCss).toContain('.presentation-control-panel')
    expect(productShellCss).toContain('.presentation-hero-card')
    expect(productShellCss).toContain('.presentation-action-grid')
    expect(componentIndexCss).toContain("@import './cruise-line-operations.css';")
    expect(operationsAggregateCss).toContain("@import './cruise-line-operations-layout.css';")

    const operationsLayoutCss = read('frontend/react/src/styles/components/cruise-line-operations-layout.css')
    expect(operationsLayoutCss).toMatch(/\.cruise-line-selected-scope\s*\{[\s\S]*background:\s*var\(--admin-card-soft-bg, #f8fbfe\) !important;[\s\S]*color:\s*#071827 !important;/)
    expect(operationsLayoutCss).toContain('.cruise-line-selected-scope :is(h3, p, dt, dd)')
    expect(operationsLayoutCss).toMatch(/\.cruise-line-selected-scope-status\s*\{[\s\S]*background:\s*#e0f2fe !important;[\s\S]*color:\s*#0c4a6e !important;/)
    expect(productShellCss).not.toContain('.presentation-readiness-panel')
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'))).toBe(false)
    expect(legacyCss).not.toContain('.presentation-demo-flow')
    expect(legacyCss).not.toContain('.presentation-commercial-grid')
    expect(legacyCss).not.toContain('.presentation-operator-grid')
    expect(legacyCss).not.toContain('.operations-presentation-guide')
  })
})
