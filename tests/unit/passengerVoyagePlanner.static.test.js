const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('passenger voyage planner static contracts', () => {
  it('adds a functional passenger-facing voyage planner instead of another development readiness panel', () => {
    const dashboard = read('frontend/react/src/components/ReactRoleDashboard.jsx')
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(dashboard).toContain('function PassengerVoyagePlanner')
    expect(dashboard).toContain('data-testid="react-passenger-voyage-planner"')
    expect(dashboard).toContain('data-testid="react-voyage-checklist"')
    expect(dashboard).toContain('updatePassengerPreCruiseChecklist')
    expect(dashboard).toContain('data-testid={`react-voyage-checklist-${id}`}')
    expect(dashboard).toContain('Checklist progress is saved to this passenger profile.')
    expect(dashboard).toContain('favoriteItineraryActivitiesByBooking')
    expect(app).not.toContain('react-workspace-public-launch-button')
    expect(app).not.toContain('react-workspace-production-hardening-button')
    expect(styles).toContain('.passenger-voyage-planner')
    expect(styles).toContain('.voyage-booking-card')
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
