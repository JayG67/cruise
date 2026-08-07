const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('operational dashboard selection ownership', () => {
  const dashboard = read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx')
  const selectionState = read('frontend/react/src/components/operations/useOperationalDashboardSelectionState.js')
  const navigation = read('frontend/react/src/components/operations/operationalDashboardNavigation.js')

  test('delegates synchronized workspace selection state out of the dashboard renderer', () => {
    expect(dashboard).toContain("from './useOperationalDashboardSelectionState.js'")
    expect(dashboard).toContain('useOperationalDashboardSelectionState({ readinessOperations, roleView, selectedDemoUser })')
    expect(dashboard).not.toContain("const [selectedTurnaroundId, setSelectedTurnaroundId] = useState('')")
    expect(dashboard).not.toContain("const [selectedTaskId, setSelectedTaskId] = useState('')")
    expect(dashboard).not.toContain("setActiveOperationsWorkspace('overview')")
  })

  test('keeps selection repair and role-aware defaults inside the focused hook', () => {
    expect(selectionState).toContain('export function useOperationalDashboardSelectionState')
    expect(selectionState).toContain('normalizeOperationalRoleName(roleView)')
    expect(selectionState).toContain('setSelectedTaskId(taskKey(tasks[0]))')
    expect(selectionState).toContain('setSelectedDependencyId(dependencyKey(dependencies[0]))')
    expect(selectionState).toContain('setSelectedReadinessRole((roleSignoff || signoffs[0]).departmentRole)')
    expect(selectionState).toContain("setActiveOperationsWorkspace('overview')")
  })

  test('keeps workspace routing rules pure and independently reviewable', () => {
    expect(dashboard).toContain("from './operationalDashboardNavigation.js'")
    expect(navigation).toContain('export const OPERATIONS_WORKSPACE_TABS')
    expect(navigation).toContain('export function getLifecycleTargetWorkspace')
    expect(navigation).toContain('export function getPhaseTargetWorkspace')
    expect(navigation).not.toContain('useState')
    expect(navigation).not.toContain('document.')
  })
})
