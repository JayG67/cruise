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
    const controller = read('controllers/platformOperationsAdmin.controller.js')
    const validation = read('validation/cruise.validation.js')

    expect(service).toContain('TURNAROUND_OPERATIONAL_ROLES')
    expect(service).toContain('assertSingleCruiseLineAssignment')
    expect(service).toContain('assertNoSameDayTurnaroundConflict')
    expect(service).toContain('getTurnaroundPersonBaseName')
    expect(service).toContain('Turnaround personnel can belong to exactly one cruise line')
    expect(service).toContain('Turnaround personnel cannot be assigned to more than one turnaround sailing on the same date')
    expect(service).toContain('This turnaround person is already assigned to the selected sailing')
    expect(service).toContain('assertShipBelongsToCruiseLine')
    expect(service).toContain('assignedSailingId')
    expect(service).toContain('Select a ship before assigning a turnaround sailing')
    expect(service).toContain('createTurnaroundPerson')
    expect(service).toContain('demoUserTable')
    expect(routes).toContain("'/turnaround-admin/setup'")
    expect(routes).toContain("'/turnaround-admin/people'")
    expect(controller).toContain('getTurnaroundAdminSetup')
    expect(controller).toContain('TURNAROUND_PERSON_CREATED')
    expect(controller).toContain('TURNAROUND_PERSON_UNASSIGNED')
    expect(service).toContain('assignedShipId: null')
    expect(service).toContain('assignedSailingId: null')
    expect(validation).toContain('turnaroundPersonAssignmentSchema')
    expect(validation).toContain('assignedSailingId')
  })

  it('surfaces the admin setup panel before the quality freeze checkpoint', () => {
    const app = read('frontend/react/src/App.jsx')
    const component = [
      read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx'),
      read('frontend/react/src/components/useTurnaroundAdminSetupState.js')
    ].join('\n')
    const client = read('frontend/react/src/api/platformClient.js')
    const workspace = read('frontend/react/src/domain/turnaroundAdminWorkspace.js')

    expect(app).toContain('ReactTurnaroundAdminSetup')
    expect(app.indexOf('<ReactTurnaroundAdminSetup')).toBeLessThan(app.indexOf('<OperationsIntelligenceCenter'))
    expect(component).toContain('data-testid="react-turnaround-admin-setup"')
    expect(component).toContain('data-testid="react-turnaround-admin-person-form"')
    expect(component).toContain('data-testid="react-turnaround-admin-roster-person"')
    expect(component).toContain('data-testid="react-turnaround-admin-assign-existing-person"')
    expect(component).toContain('selectedTurnaroundLabel')
    expect(component).toContain('data-testid="react-turnaround-admin-assignment-model"')
    expect(component).toContain('buildRosterGroups')
    expect(workspace).toContain('export function buildRosterGroups')
    expect(workspace).toContain('export function buildSameDayConflicts')
    expect(component).toContain('No same-day conflict')
    expect(component).not.toContain('getAssignedSailingId')
    expect(workspace).toContain('export function getAssignedSailingId')
    expect(component).toContain('data-testid="react-turnaround-admin-same-day-conflicts"')
    expect(component).toContain('data-testid="react-turnaround-admin-conflict-summary"')
    expect(client).toContain('getTurnaroundAdminSetup')
    expect(client).toContain('createTurnaroundPerson')
    expect(client).toContain('updateTurnaroundPerson')
  })
})
