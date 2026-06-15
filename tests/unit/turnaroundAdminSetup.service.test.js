const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('turnaround admin setup static contracts', () => {
  it('adds admin APIs for scoped turnaround personnel without creating a parallel authorization system', () => {
    const service = read('services/turnaroundAdminSetup.service.js')
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const validation = read('validation/cruise.validation.js')

    expect(service).toContain('TURNAROUND_OPERATIONAL_ROLES')
    expect(service).toContain('assertSingleCruiseLineAssignment')
    expect(service).toContain('Turnaround personnel can belong to exactly one cruise line')
    expect(service).toContain('assertShipBelongsToCruiseLine')
    expect(service).toContain('createTurnaroundPerson')
    expect(service).toContain('demoUserTable')
    expect(routes).toContain("'/turnaround-admin/setup'")
    expect(routes).toContain("'/turnaround-admin/people'")
    expect(controller).toContain('getTurnaroundAdminSetup')
    expect(controller).toContain('TURNAROUND_PERSON_CREATED')
    expect(validation).toContain('turnaroundPersonAssignmentSchema')
  })

  it('surfaces the admin setup panel before the quality freeze checkpoint', () => {
    const app = read('frontend/react/src/App.jsx')
    const component = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const client = read('frontend/react/src/api/client.js')

    expect(app).toContain('ReactTurnaroundAdminSetup')
    expect(app.indexOf('<ReactTurnaroundAdminSetup')).toBeLessThan(app.indexOf('<section id="react-quality"'))
    expect(component).toContain('data-testid="react-turnaround-admin-setup"')
    expect(component).toContain('data-testid="react-turnaround-admin-person-form"')
    expect(component).toContain('data-testid="react-turnaround-admin-roster-person"')
    expect(client).toContain('getTurnaroundAdminSetup')
    expect(client).toContain('createTurnaroundPerson')
    expect(client).toContain('updateTurnaroundPerson')
  })
})
