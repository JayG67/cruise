const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('role operations domain ownership', () => {
  const facade = read('frontend/react/src/domain/roleOperations.js')
  const assignments = read('frontend/react/src/domain/roleOperationalAssignments.js')
  const commandCenters = read('frontend/react/src/domain/roleOperationalCommandCenters.js')
  const readiness = read('frontend/react/src/domain/roleOperationalReadiness.js')

  it('keeps the existing role operations public surface behind a stable facade', () => {
    expect(facade).toContain("export * from './roleOperationalAssignments.js'")
    expect(facade).toContain("export * from './roleOperationalReadiness.js'")
    expect(facade).not.toContain('function ')
  })

  it('keeps operational assignment visibility and identity rules together', () => {
    expect(assignments).toContain('export function getVisibleTurnaroundOperations')
    expect(assignments).toContain('export function normalizeOperationalDemoUsers')
    expect(assignments).toContain('operationHasRoleUserAssignment')
    expect(assignments).not.toContain('buildTurnaroundOperationCards')
    expect(assignments).not.toContain('getCommandCenterFallback')
  })

  it('keeps command and continuity fallback projection isolated', () => {
    expect(commandCenters).toContain('export function getCommandCenterFallback')
    expect(commandCenters).toContain('export function getContinuityCenterFallback')
    expect(commandCenters).not.toContain('getVisibleTurnaroundOperations')
    expect(commandCenters).not.toContain('buildTurnaroundReadinessBookings')
  })

  it('keeps readiness card and booking projection as the composition boundary', () => {
    expect(readiness).toContain('export function buildTurnaroundOperationCards')
    expect(readiness).toContain('export function buildTurnaroundReadinessBookings')
    expect(readiness).toContain('getCommandCenterFallback(operation, tasks, taskSummary)')
    expect(readiness).toContain('getContinuityCenterFallback(operation, tasks, taskSummary)')
    expect(readiness).not.toContain('operationHasRoleUserAssignment')
  })
})
