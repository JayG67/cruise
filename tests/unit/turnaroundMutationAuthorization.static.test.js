const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const routes = fs.readFileSync(path.join(projectRoot, 'routes/cruise.routes.js'), 'utf8')
const service = fs.readFileSync(path.join(projectRoot, 'services/turnaroundAccess.service.js'), 'utf8')

const protectedReadRoutes = [
  ["get", '/turnaround-admin/setup', 'requireAdminAccess'],
  ["get", '/turnaround-operations', 'requireTurnaroundReadAccess'],
  ["get", '/turnaround-operations/:id/audit-events', 'requireTurnaroundOperationReadAccess']
]

const protectedRoutes = [
  ["patch", '/turnaround-operations/:id', 'requireTurnaroundCommandAccess'],
  ["post", '/turnaround-operations/:id/escalations', 'requireTurnaroundDepartmentAccess'],
  ["patch", '/turnaround-escalations/:id', 'requireTurnaroundEscalationAccess'],
  ["patch", '/turnaround-handoffs/:id', 'requireTurnaroundHandoffAccess'],
  ["patch", '/turnaround-operations/:id/staffing/:departmentRole', 'requireTurnaroundDepartmentAccess'],
  ["patch", '/turnaround-operations/:id/signoffs/:departmentRole', 'requireTurnaroundDepartmentAccess'],
  ["patch", '/turnaround-tasks/:id/status', 'requireTurnaroundTaskAccess'],
  ["patch", '/turnaround-tasks/:id/details', 'requireTurnaroundTaskAccess'],
  ["post", '/turnaround-operations/:id/tasks', 'requireTurnaroundDepartmentAccess'],
  ["post", '/turnaround-tasks/:id/updates', 'requireTurnaroundTaskAccess'],
  ["delete", '/turnaround-tasks/:id', 'requireTurnaroundTaskAccess']
]

describe('turnaround operational authorization contracts', () => {
  it.each(protectedReadRoutes)('protects %s %s with %s', (method, routePath, middlewareName) => {
    const routeStart = `router.${method}(\n  '${routePath}',`
    const startIndex = routes.indexOf(routeStart)
    expect(startIndex).toBeGreaterThanOrEqual(0)
    const routeBlock = routes.slice(startIndex, routes.indexOf('\n)', startIndex) + 2)
    expect(routeBlock).toContain(middlewareName)
  })
  it.each(protectedRoutes)('protects %s %s with %s', (method, routePath, middlewareName) => {
    const routeStart = `router.${method}(\n  '${routePath}',`
    const startIndex = routes.indexOf(routeStart)
    expect(startIndex).toBeGreaterThanOrEqual(0)
    const routeBlock = routes.slice(startIndex, routes.indexOf('\n)', startIndex) + 2)
    expect(routeBlock).toContain(middlewareName)
  })

  it('binds production operational access to server-side app-user ship/cruise-line scope', () => {
    expect(service).toContain("require('../models/appUser.model')")
    expect(service).toContain("require('../models/appUserRole.model')")
    expect(service).toContain('normalizeOperationalRole(row.roleId) === normalizedRole')
    expect(service).toContain('appUser.assignedShipId')
    expect(service).toContain('appUser.cruiseLineId')
    expect(service).toContain('scope.assignedShipId === context.ship.id')
    expect(service).toContain('scope.cruiseLineId === context.ship.cruiseLineId')
    expect(service).toContain('appUserRoleTable')
  })

  it('keeps handoff authorization resource-aware without mounting an operation middleware factory directly', () => {
    const routeStart = "router.patch(\n  '/turnaround-handoffs/:id',"
    const startIndex = routes.indexOf(routeStart)
    expect(startIndex).toBeGreaterThanOrEqual(0)
    const routeBlock = routes.slice(startIndex, routes.indexOf('\n)', startIndex) + 2)

    expect(routeBlock).toContain('requireTurnaroundHandoffAccess')
    expect(routeBlock).not.toContain('requireTurnaroundOperationReadAccess')
    expect(routeBlock).not.toContain('requireTurnaroundReadAccess')
  })

  it('enforces department-role ownership rather than trusting a resource ID alone', () => {
    expect(service).toContain('canRoleManageDepartment(scope.role, departmentRole)')
    expect(service).toContain('task.departmentRole')
    expect(service).toContain('escalation.departmentRole')
    expect(service).toContain('handoff.fromDepartmentRole')
    expect(service).toContain('handoff.toDepartmentRole')
  })
})
