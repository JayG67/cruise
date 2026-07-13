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

describe('passenger voyage planner static contracts', () => {
  it('adds a functional passenger-facing voyage planner instead of another development readiness panel', () => {
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const passengerSurface = read('frontend/react/src/components/passenger/RolePassengerSurface.jsx')
    const roleBookingList = read('frontend/react/src/components/passenger/RoleBookingList.jsx')
    const roleBookingCard = read('frontend/react/src/components/passenger/RoleBookingCard.jsx')
    const app = read('frontend/react/src/App.jsx')
    const passengerStyles = read('frontend/react/src/styles/components/passenger.css')
    const productShellStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css')
    const componentIndexStyles = read('frontend/react/src/styles/components/index.css')

    expect(passengerSurface).toContain('function PassengerVoyagePlanner')
    expect(passengerSurface).toContain('data-testid="react-passenger-voyage-planner"')
    expect(passengerSurface).toContain('data-testid="react-voyage-checklist"')
    expect(passengerSurface).toContain('updatePassengerPreCruiseChecklist')
    expect(passengerSurface).toContain('data-testid={`react-voyage-checklist-${id}`}')
    expect(passengerSurface).toContain('Checklist progress is saved to this passenger profile.')
    expect(passengerSurface).toContain('favoriteItineraryActivitiesByBooking')
    expect(dashboard).toContain("from './passenger/RolePassengerSurface.jsx'")
    expect(dashboard).toContain('favoriteItineraryActivitiesByBooking')
    expect(dashboard).toContain("import RoleBookingList from './passenger/RoleBookingList.jsx'")
    expect(roleBookingList).toContain('export default function RoleBookingList')
    expect(roleBookingList).toContain('favoriteItineraryActivitiesByBooking')
    expect(roleBookingList).toContain('getBookingItineraryDays')
    expect(roleBookingCard).toContain('export default function RoleBookingCard')
    expect(roleBookingCard).toContain('function RoleBookingDetails')
    expect(app).not.toContain('react-workspace-public-launch-button')
    expect(app).not.toContain('react-workspace-production-hardening-button')
    expect(componentIndexStyles).toContain("@import './passenger.css';")
    expect(componentIndexStyles).toContain("@import './product-shell.css';")
    expect(passengerStyles).toContain('.passenger-voyage-planner')
    expect(passengerStyles).toContain('.voyage-booking-card')
    expect(productShellStyles).toContain('.passenger-voyage-planner')
    expect(productShellStyles).toContain('.voyage-booking-card')
  })
})


  it('keeps pre-cruise checklist persistence in the API and database schema', () => {
    const controller = read('controllers/cruise.controller.js')
    const routes = read('routes/cruise.routes.js')
    const initializer = read('services/initializeDatabase.service.js')
    const client = read('frontend/react/src/api/client.js')

    expect(initializer).toContain('CREATE TABLE IF NOT EXISTS customer_pre_cruise_checklists')
    expect(controller).toContain('exports.updatePassengerPreCruiseChecklist')
    expect(routes).toContain('/customers/:id/pre-cruise-checklist')
    expect(client).toContain('updatePassengerPreCruiseChecklist')
  })
