const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('turnaround admin setup state ownership', () => {
  test('delegates setup loading, mutation, filtering, and draft transitions to a focused hook', () => {
    const component = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const stateHook = read('frontend/react/src/components/useTurnaroundAdminSetupState.js')

    expect(component).toContain("import useTurnaroundAdminSetupState from './useTurnaroundAdminSetupState.js'")
    expect(component).toContain('useTurnaroundAdminSetupState({ selectedDemoUser, onSetupChanged })')
    expect(component).not.toContain('useState(')
    expect(component).not.toContain('useEffect(')
    expect(component).not.toContain('getTurnaroundAdminSetup(')
    expect(component).not.toContain('createTurnaroundPerson(')
    expect(component).not.toContain('updateTurnaroundPerson(')
    expect(component).not.toContain('deleteTurnaroundPerson(')

    expect(stateHook).toContain('async function loadSetup({ announce = false } = {})')
    expect(stateHook).toContain('async function runMutation(')
    expect(stateHook).toContain('async function handleSubmit(event)')
    expect(stateHook).toContain('async function handleAssignRosterPersonToSelectedTurnaround(person)')
    expect(stateHook).toContain('async function handleRemovePerson(person)')
    expect(stateHook).toContain('buildTurnaroundTeamWorkspace({')
    expect(stateHook).toContain('buildRosterGroups(')
    expect(stateHook).toContain('filteredRosterGroups')
    expect(stateHook).toContain("if (fieldName === 'cruiseLineId')")
    expect(stateHook).toContain("if (fieldName === 'assignedShipId')")
    expect(stateHook).toContain('reconcileTurnaroundSetupDraft(current, response)')
  })

  test('keeps manual setup reload visible, accessible, and separate from the decorative heading', () => {
    const component = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const refreshControl = read('frontend/react/src/components/TurnaroundSetupRefreshControl.jsx')
    const stateHook = read('frontend/react/src/components/useTurnaroundAdminSetupState.js')
    const refreshDomain = read('frontend/react/src/domain/turnaroundSetupRefresh.js')
    const css = read('frontend/react/src/styles/components/admin-turnaround.css')

    expect(component).toContain("import TurnaroundSetupRefreshControl from './TurnaroundSetupRefreshControl.jsx'")
    expect(component).toContain('<TurnaroundSetupRefreshControl')
    expect(component).toContain('onReload={() => loadSetup({ announce: true })}')
    expect(refreshControl).toContain('react-turnaround-admin-refresh-control')
    expect(refreshControl).toContain('role="status" aria-live="polite"')
    expect(refreshControl).toContain("isLoading ? 'Reloading setup data...' : 'Reload setup data'")
    expect(stateHook).toContain("setRefreshStatus('Reloading turnaround setup data...')")
    expect(stateHook).toContain('formatTurnaroundSetupRefreshSummary(response)')
    expect(refreshDomain).toContain('Setup data reloaded.')
    expect(refreshDomain).toContain('export function reconcileTurnaroundSetupDraft')
    expect(refreshDomain).toContain('cruiseLines.some(line => line.id === current.cruiseLineId)')
    expect(refreshDomain).toContain('ships.some(ship => ship.id === current.assignedShipId && ship.cruiseLineId === cruiseLineId)')
    expect(refreshDomain).toContain('sailings.some(sailing => sailing.id === current.sailingId && sailing.shipId === assignedShipId)')
    expect(css).toContain('.turnaround-admin-setup-panel .turnaround-admin-refresh-control')
    expect(css).toContain('flex-direction: column !important;')
  })

  test('does not retain the retired unused assigned-sailing compatibility import', () => {
    const component = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const stateHook = read('frontend/react/src/components/useTurnaroundAdminSetupState.js')
    const domain = read('frontend/react/src/domain/turnaroundAdminWorkspace.js')

    expect(component).not.toContain('getAssignedSailingId')
    expect(stateHook).not.toContain('getAssignedSailingId')
    expect(domain).toContain('export function getAssignedSailingId')
  })
})
