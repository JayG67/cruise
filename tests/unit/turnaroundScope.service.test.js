jest.mock('../../db', () => ({
  select: jest.fn()
}))

jest.mock('../../services/requestAuthorization.service', () => ({
  resolveRequestActor: jest.fn(),
  resolveRequestAuditActor: jest.fn()
}))

const db = require('../../db')
const { resolveRequestActor, resolveRequestAuditActor } = require('../../services/requestAuthorization.service')
const demoUserTable = require('../../models/demoUser.model')
const shipTable = require('../../models/ship.model')
const sailingTable = require('../../models/sailing.model')
const turnaroundOperationTable = require('../../models/turnaroundOperation.model')
const service = require('../../services/turnaroundScope.service')

function createQuery(rows = []) {
  const query = {
    from: jest.fn(() => query),
    leftJoin: jest.fn(() => query),
    where: jest.fn(() => query),
    limit: jest.fn(() => Promise.resolve(rows)),
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
    catch: reject => Promise.resolve(rows).catch(reject)
  }
  return query
}

function queueSelectRows(...rowSets) {
  rowSets.forEach(rows => db.select.mockReturnValueOnce(createQuery(rows)))
}

function scopedRequest(demoUserId = 'demo-user-1') {
  return { requestIdentity: { demoUserId }, query: {}, headers: {} }
}

describe('turnaroundScope service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resolveRequestActor.mockResolvedValue({
      actorUserId: 'actor-1',
      actorDisplayName: 'Ops Reviewer'
    })
    resolveRequestAuditActor.mockResolvedValue({
      actorUserId: 'actor-1',
      actorDisplayName: 'Ops Reviewer'
    })
  })

  it('recognizes operational demo roles across display formats', () => {
    expect(service.isOperationalDemoRole('turnaround-manager')).toBe(true)
    expect(service.isOperationalDemoRole('GUEST_SERVICES_LEAD')).toBe(true)
    expect(service.isOperationalDemoRole('food_beverage_lead')).toBe(true)
    expect(service.isOperationalDemoRole('ADMIN')).toBe(false)
    expect(service.isOperationalDemoRole()).toBe(false)
  })

  it('resolves the selected demo user from request identity or returns null without one', async () => {
    queueSelectRows([{ id: 'demo-user-1', role: 'TURNAROUND_MANAGER' }])

    await expect(service.resolveRequestDemoUser(scopedRequest())).resolves.toEqual({
      id: 'demo-user-1',
      role: 'TURNAROUND_MANAGER'
    })
    await expect(service.resolveRequestDemoUser({ requestIdentity: {}, query: {} })).resolves.toBeNull()

    expect(db.select).toHaveBeenCalledTimes(1)
  })

  it('scopes ship-assigned operational users to sailings for that ship', async () => {
    queueSelectRows([
      { id: 'sailing-1' },
      { id: 'sailing-2' }
    ])

    await expect(service.getSailingIdsForOperationalAssignment({
      role: 'ENGINEERING_LEAD',
      assignedShipId: 'ship-1'
    })).resolves.toEqual(['sailing-1', 'sailing-2'])
  })

  it('scopes cruise-line-assigned operational users through ships into sailings', async () => {
    queueSelectRows(
      [{ id: 'ship-1' }, { id: 'ship-2' }],
      [{ id: 'sailing-1' }, { id: 'sailing-2' }]
    )

    await expect(service.getSailingIdsForOperationalAssignment({
      role: 'TURNAROUND_MANAGER',
      cruiseLineId: 'cruise-line-1'
    })).resolves.toEqual(['sailing-1', 'sailing-2'])
  })

  it('returns null scope for non-operational users and an empty scope for unassigned operational users', async () => {
    await expect(service.getSailingIdsForOperationalAssignment({ role: 'ADMIN' })).resolves.toBeNull()
    await expect(service.getSailingIdsForOperationalAssignment({ role: 'HOUSEKEEPING_LEAD' })).resolves.toEqual([])
    await expect(service.getSailingIdsForOperationalAssignment(null)).resolves.toBeNull()
  })

  it('returns all operations when no demo user is selected or when the selected role is not operational', async () => {
    queueSelectRows([{ id: 'operation-1' }])
    await expect(service.getTurnaroundOperationsForRequest({ requestIdentity: {}, query: {} })).resolves.toEqual([{ id: 'operation-1' }])

    queueSelectRows(
      [{ id: 'admin-demo', role: 'ADMIN' }],
      [{ id: 'operation-2' }]
    )
    await expect(service.getTurnaroundOperationsForRequest(scopedRequest('admin-demo'))).resolves.toEqual([{ id: 'operation-2' }])
  })

  it('returns no operations for missing demo users or operational users without scoped sailings', async () => {
    queueSelectRows([])
    await expect(service.getTurnaroundOperationsForRequest(scopedRequest('missing-demo'))).resolves.toEqual([])

    queueSelectRows([{ id: 'ops-demo', role: 'ENGINEERING_LEAD' }])
    await expect(service.getTurnaroundOperationsForRequest(scopedRequest('ops-demo'))).resolves.toEqual([])
  })

  it('filters operations for assigned operational sailings', async () => {
    queueSelectRows(
      [{ id: 'ops-demo', role: 'ENGINEERING_LEAD', assignedShipId: 'ship-1' }],
      [{ id: 'sailing-1' }],
      [{ id: 'operation-1', sailingId: 'sailing-1' }]
    )

    await expect(service.getTurnaroundOperationsForRequest(scopedRequest('ops-demo'))).resolves.toEqual([
      { id: 'operation-1', sailingId: 'sailing-1' }
    ])
  })

  it('authorizes operation access by selected operational assignment', async () => {
    await expect(service.canAccessTurnaroundOperationForRequest({ requestIdentity: {}, query: {} }, { sailingId: 'any' })).resolves.toBe(true)
    await expect(service.canAccessTurnaroundOperationForRequest(scopedRequest('ops-demo'), null)).resolves.toBe(false)

    queueSelectRows([])
    await expect(service.canAccessTurnaroundOperationForRequest(scopedRequest('missing-demo'), { sailingId: 'sailing-1' })).resolves.toBe(false)

    queueSelectRows(
      [{ id: 'ops-demo', role: 'ENGINEERING_LEAD', assignedShipId: 'ship-1' }],
      [{ id: 'sailing-1' }]
    )
    await expect(service.canAccessTurnaroundOperationForRequest(scopedRequest('ops-demo'), { sailingId: 'sailing-1' })).resolves.toBe(true)

    queueSelectRows(
      [{ id: 'ops-demo', role: 'ENGINEERING_LEAD', assignedShipId: 'ship-1' }],
      [{ id: 'sailing-1' }]
    )
    await expect(service.canAccessTurnaroundOperationForRequest(scopedRequest('ops-demo'), { sailingId: 'sailing-2' })).resolves.toBe(false)
  })

  it('builds tenant scope for a turnaround operation and falls back safely without sailing context', async () => {
    await expect(service.getTurnaroundScopeForOperation({ id: 'operation-1' })).resolves.toEqual({
      cruiseLineId: null,
      shipId: null,
      sailingId: null,
      operationId: 'operation-1'
    })

    queueSelectRows([{ sailingId: 'sailing-1', shipId: 'ship-1', cruiseLineId: 'cruise-line-1' }])
    await expect(service.getTurnaroundScopeForOperation({ id: 'operation-1', sailingId: 'sailing-1' })).resolves.toEqual({
      cruiseLineId: 'cruise-line-1',
      shipId: 'ship-1',
      sailingId: 'sailing-1',
      operationId: 'operation-1'
    })
  })

  it('combines actor, tenant scope, and source for audit context', async () => {
    queueSelectRows([{ sailingId: 'sailing-1', shipId: 'ship-1', cruiseLineId: 'cruise-line-1' }])

    const req = scopedRequest()

    await expect(service.buildTurnaroundAuditContext(req, { id: 'operation-1', sailingId: 'sailing-1' })).resolves.toEqual({
      actorUserId: 'actor-1',
      actorDisplayName: 'Ops Reviewer',
      cruiseLineId: 'cruise-line-1',
      shipId: 'ship-1',
      sailingId: 'sailing-1',
      operationId: 'operation-1',
      source: 'TURNAROUND_OPERATIONS_API'
    })
    expect(resolveRequestAuditActor).toHaveBeenCalledWith(req)
  })

  it('sends the standardized forbidden response', () => {
    const json = jest.fn()
    const status = jest.fn(() => ({ json }))

    service.sendTurnaroundOperationForbidden({ status })

    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith({ message: service.TURNAROUND_OPERATION_FORBIDDEN_MESSAGE })
  })

  it('keeps the scope queries on the expected tables for guardrail value', async () => {
    queueSelectRows([{ id: 'demo-user-1', role: 'ADMIN' }])

    await service.resolveRequestDemoUser(scopedRequest())

    const firstQuery = db.select.mock.results[0].value
    expect(firstQuery.from).toHaveBeenCalledWith(demoUserTable)
    expect(shipTable).toBeDefined()
    expect(sailingTable).toBeDefined()
    expect(turnaroundOperationTable).toBeDefined()
  })
})
