jest.mock('../../db', () => ({
  select: jest.fn()
}))

const db = require('../../db')
const {
  canAccessOperationScope,
  canManageEscalation,
  canManageHandoff,
  canManageOperation,
  canManageOperationDepartment,
  canManageTask,
  canReadTurnaroundOperations,
  canRoleManageDepartment,
  isTurnaroundManager,
  normalizeOperationalRole,
  resolveOperationContext,
  resolvePrincipalOperationalScope
} = require('../../services/turnaroundAccess.service')

function queueSelectRows(...rowSets) {
  const queue = [...rowSets]

  db.select.mockImplementation(() => ({
    from: () => ({
      where: () => {
        const rows = queue.shift() || []
        const result = {
          limit: async () => rows,
          then(resolve, reject) {
            return Promise.resolve(rows).then(resolve, reject)
          }
        }
        return result
      }
    })
  }))
}

function requestFor(userId, role) {
  return {
    requestIdentity: {
      principal: { userId, role }
    }
  }
}

describe('turnaround operational authorization role contracts', () => {
  beforeEach(() => {
    db.select.mockReset()
  })

  it('normalizes operational role spellings consistently', () => {
    expect(normalizeOperationalRole('housekeeping-lead')).toBe('HOUSEKEEPING_LEAD')
    expect(normalizeOperationalRole('Guest Services Lead')).toBe('GUEST_SERVICES_LEAD')
  })

  it('treats turnaround managers as operation-wide operational authorities', () => {
    expect(isTurnaroundManager('TURNAROUND_MANAGER')).toBe(true)
    expect(canRoleManageDepartment('TURNAROUND_MANAGER', 'ENGINEERING_LEAD')).toBe(true)
  })

  it('limits department leads to their own department', () => {
    expect(canRoleManageDepartment('HOUSEKEEPING_LEAD', 'HOUSEKEEPING_LEAD')).toBe(true)
    expect(canRoleManageDepartment('HOUSEKEEPING_LEAD', 'ENGINEERING_LEAD')).toBe(false)
  })

  it('keeps administrators as an explicit override', () => {
    expect(canRoleManageDepartment('ADMIN', 'GUEST_SERVICES_LEAD')).toBe(true)
  })

  it('fails closed when a verified principal is missing', async () => {
    await expect(resolvePrincipalOperationalScope({})).resolves.toBeNull()
    await expect(canReadTurnaroundOperations({})).resolves.toBe(false)
    await expect(canManageOperation({}, 'OP-1')).resolves.toBe(false)
  })

  it('returns an unrestricted operational scope for administrators without database lookup', async () => {
    await expect(resolvePrincipalOperationalScope(requestFor('admin-1', 'ADMIN'))).resolves.toEqual({
      userId: 'admin-1',
      role: 'ADMIN',
      isAdmin: true,
      cruiseLineId: null,
      assignedShipId: null
    })
    expect(db.select).not.toHaveBeenCalled()
  })

  it('requires an active app user and matching active role assignment', async () => {
    queueSelectRows([], [{ roleId: 'HOUSEKEEPING_LEAD', status: 'ACTIVE' }])
    await expect(resolvePrincipalOperationalScope(requestFor('user-1', 'HOUSEKEEPING_LEAD'))).resolves.toBeNull()

    queueSelectRows([{ id: 'user-1', status: 'INACTIVE' }])
    await expect(resolvePrincipalOperationalScope(requestFor('user-1', 'HOUSEKEEPING_LEAD'))).resolves.toBeNull()

    queueSelectRows(
      [{ id: 'user-1', status: 'ACTIVE', assignedShipId: 'SHIP-1' }],
      [{ roleId: 'ENGINEERING_LEAD', status: 'ACTIVE', assignedShipId: 'SHIP-1' }]
    )
    await expect(resolvePrincipalOperationalScope(requestFor('user-1', 'HOUSEKEEPING_LEAD'))).resolves.toBeNull()
  })

  it('derives ship and cruise-line scope from the active server-side role assignment', async () => {
    queueSelectRows(
      [{ id: 'user-1', status: 'ACTIVE', cruiseLineId: 'CL-FALLBACK', assignedShipId: 'SHIP-FALLBACK' }],
      [{ roleId: 'housekeeping-lead', status: 'ACTIVE', cruiseLineId: 'CL-1', assignedShipId: 'SHIP-1' }]
    )

    await expect(resolvePrincipalOperationalScope(requestFor('user-1', 'HOUSEKEEPING_LEAD'))).resolves.toEqual({
      userId: 'user-1',
      role: 'HOUSEKEEPING_LEAD',
      isAdmin: false,
      cruiseLineId: 'CL-1',
      assignedShipId: 'SHIP-1'
    })
  })

  it('fails operation context resolution closed when operation, sailing, or ship is missing', async () => {
    await expect(resolveOperationContext()).resolves.toBeNull()

    queueSelectRows([])
    await expect(resolveOperationContext('OP-1')).resolves.toBeNull()

    queueSelectRows([{ id: 'OP-1', sailingId: 'SAIL-1' }], [])
    await expect(resolveOperationContext('OP-1')).resolves.toBeNull()

    queueSelectRows([{ id: 'OP-1', sailingId: 'SAIL-1' }], [{ id: 'SAIL-1', shipId: 'SHIP-1' }], [])
    await expect(resolveOperationContext('OP-1')).resolves.toBeNull()
  })

  it('resolves complete operation context and enforces assigned ship scope', async () => {
    queueSelectRows(
      [{ id: 'user-1', status: 'ACTIVE' }],
      [{ roleId: 'HOUSEKEEPING_LEAD', status: 'ACTIVE', assignedShipId: 'SHIP-1' }],
      [{ id: 'OP-1', sailingId: 'SAIL-1' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }]
    )
    await expect(canAccessOperationScope(requestFor('user-1', 'HOUSEKEEPING_LEAD'), 'OP-1')).resolves.toBe(true)

    queueSelectRows(
      [{ id: 'user-1', status: 'ACTIVE' }],
      [{ roleId: 'HOUSEKEEPING_LEAD', status: 'ACTIVE', assignedShipId: 'SHIP-2' }],
      [{ id: 'OP-1', sailingId: 'SAIL-1' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }]
    )
    await expect(canAccessOperationScope(requestFor('user-1', 'HOUSEKEEPING_LEAD'), 'OP-1')).resolves.toBe(false)
  })

  it('supports cruise-line scope when no ship assignment exists and rejects non-operational roles', async () => {
    queueSelectRows(
      [{ id: 'user-1', status: 'ACTIVE' }],
      [{ roleId: 'TURNAROUND_MANAGER', status: 'ACTIVE', cruiseLineId: 'CL-1' }],
      [{ id: 'OP-1', sailingId: 'SAIL-1' }],
      [{ id: 'SAIL-1', shipId: 'SHIP-1' }],
      [{ id: 'SHIP-1', cruiseLineId: 'CL-1' }]
    )
    await expect(canAccessOperationScope(requestFor('user-1', 'TURNAROUND_MANAGER'), 'OP-1')).resolves.toBe(true)

    queueSelectRows(
      [{ id: 'user-2', status: 'ACTIVE' }],
      [{ roleId: 'PASSENGER', status: 'ACTIVE', cruiseLineId: 'CL-1' }]
    )
    await expect(canAccessOperationScope(requestFor('user-2', 'PASSENGER'), 'OP-1')).resolves.toBe(false)
  })

  it('allows operational reads only for admins, managers, and department leads', async () => {
    await expect(canReadTurnaroundOperations(requestFor('admin-1', 'ADMIN'))).resolves.toBe(true)

    queueSelectRows(
      [{ id: 'manager-1', status: 'ACTIVE' }],
      [{ roleId: 'TURNAROUND_MANAGER', status: 'ACTIVE', assignedShipId: 'SHIP-1' }]
    )
    await expect(canReadTurnaroundOperations(requestFor('manager-1', 'TURNAROUND_MANAGER'))).resolves.toBe(true)

    queueSelectRows(
      [{ id: 'passenger-1', status: 'ACTIVE' }],
      [{ roleId: 'PASSENGER', status: 'ACTIVE' }]
    )
    await expect(canReadTurnaroundOperations(requestFor('passenger-1', 'PASSENGER'))).resolves.toBe(false)
  })

  it('requires turnaround-manager authority for operation-wide mutation', async () => {
    queueSelectRows(
      [{ id: 'lead-1', status: 'ACTIVE' }],
      [{ roleId: 'HOUSEKEEPING_LEAD', status: 'ACTIVE', assignedShipId: 'SHIP-1' }]
    )
    await expect(canManageOperation(requestFor('lead-1', 'HOUSEKEEPING_LEAD'), 'OP-1')).resolves.toBe(false)
  })

  it('fails department mutation before operation lookup when the department does not match', async () => {
    queueSelectRows(
      [{ id: 'lead-1', status: 'ACTIVE' }],
      [{ roleId: 'HOUSEKEEPING_LEAD', status: 'ACTIVE', assignedShipId: 'SHIP-1' }]
    )
    await expect(canManageOperationDepartment(requestFor('lead-1', 'HOUSEKEEPING_LEAD'), 'OP-1', 'ENGINEERING_LEAD')).resolves.toBe(false)
  })

  it('fails task and escalation authorization when resources do not exist', async () => {
    queueSelectRows([])
    await expect(canManageTask(requestFor('lead-1', 'HOUSEKEEPING_LEAD'), 'TASK-MISSING')).resolves.toBe(false)

    queueSelectRows([])
    await expect(canManageEscalation(requestFor('lead-1', 'HOUSEKEEPING_LEAD'), 'ESC-MISSING')).resolves.toBe(false)
  })

  it('enforces handoff department participation before operation-scope lookup', async () => {
    queueSelectRows(
      [{ id: 'HANDOFF-1', operationId: 'OP-1', fromDepartmentRole: 'ENGINEERING_LEAD', toDepartmentRole: 'GUEST_SERVICES_LEAD' }],
      [{ id: 'lead-1', status: 'ACTIVE' }],
      [{ roleId: 'HOUSEKEEPING_LEAD', status: 'ACTIVE', assignedShipId: 'SHIP-1' }]
    )
    await expect(canManageHandoff(requestFor('lead-1', 'HOUSEKEEPING_LEAD'), 'HANDOFF-1')).resolves.toBe(false)
  })

  it('lets administrators manage existing tasks, escalations, and handoffs', async () => {
    queueSelectRows([{ id: 'TASK-1', operationId: 'OP-1', departmentRole: 'HOUSEKEEPING_LEAD' }])
    await expect(canManageTask(requestFor('admin-1', 'ADMIN'), 'TASK-1')).resolves.toBe(true)

    queueSelectRows([{ id: 'ESC-1', operationId: 'OP-1', departmentRole: 'ENGINEERING_LEAD' }])
    await expect(canManageEscalation(requestFor('admin-1', 'ADMIN'), 'ESC-1')).resolves.toBe(true)

    queueSelectRows([{ id: 'HANDOFF-1', operationId: 'OP-1', fromDepartmentRole: 'HOUSEKEEPING_LEAD', toDepartmentRole: 'ENGINEERING_LEAD' }])
    await expect(canManageHandoff(requestFor('admin-1', 'ADMIN'), 'HANDOFF-1')).resolves.toBe(true)
  })
})
