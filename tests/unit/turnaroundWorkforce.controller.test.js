jest.mock('../../db', () => ({ select: jest.fn(), insert: jest.fn(), update: jest.fn() }))
jest.mock('drizzle-orm', () => ({ and: jest.fn((...values) => values), eq: jest.fn((field, value) => ({ field, value })) }), { virtual: true })
jest.mock('../../services/turnaroundScope.service', () => ({
  canAccessTurnaroundOperationForRequest: jest.fn(),
  sendTurnaroundOperationForbidden: jest.fn((res) => res.status(403).json({ message: 'Forbidden' }))
}))
jest.mock('../../services/turnaroundMutationSupport.service', () => ({
  buildTurnaroundHistoryPayload: jest.fn((value) => value),
  mergeTurnaroundEntity: jest.fn((previous, updates) => ({ ...previous, ...updates })),
  recordTurnaroundAuditEvent: jest.fn(),
  resolveOperationalUserIdByName: jest.fn()
}))

const db = require('../../db')
const scope = require('../../services/turnaroundScope.service')
const mutationSupport = require('../../services/turnaroundMutationSupport.service')
const { createTurnaroundWorkforceController } = require('../../controllers/turnaroundWorkforce.controller')
const mockResponse = require('./helpers/mockResponse')

const getTurnaroundOperationDetails = jest.fn()
const controller = createTurnaroundWorkforceController({ getTurnaroundOperationDetails })

function selectLimit(result) {
  const limit = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ limit })
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
}
function mockUpdate(returnedRows = [{ id: 'UPDATED' }]) {
  const result = { returning: jest.fn().mockResolvedValue(returnedRows), then(resolve, reject) { return Promise.resolve().then(resolve, reject) } }
  const where = jest.fn().mockReturnValue(result)
  const set = jest.fn().mockReturnValue({ where })
  db.update.mockReturnValueOnce({ set })
  return set
}
function mockInsert(returnedRows = [{ id: 'CREATED' }]) {
  const returning = jest.fn().mockResolvedValue(returnedRows)
  const values = jest.fn().mockReturnValue({ returning })
  db.insert.mockReturnValueOnce({ values })
  return { values, returning }
}

beforeEach(() => {
  jest.clearAllMocks()
  scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
  mutationSupport.resolveOperationalUserIdByName.mockResolvedValue('USR-1')
  getTurnaroundOperationDetails.mockResolvedValue({ id: 'OP-1', decorated: true })
})

describe('turnaround workforce controller defect-discovery coverage', () => {
  it('requires the operation detail resolver', () => {
    expect(() => createTurnaroundWorkforceController({})).toThrow('getTurnaroundOperationDetails is required')
  })

  it('fails closed when a handoff has lost its parent operation', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'H-1', operationId: 'MISSING' }]); selectLimit([])

    await controller.updateTurnaroundHandoff({ params: { id: 'H-1' }, body: { status: 'COMPLETE' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(db.update).not.toHaveBeenCalled()
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })

  it('rejects an empty handoff patch before operation lookup', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'H-1', operationId: 'OP-1' }])
    await controller.updateTurnaroundHandoff({ params: { id: 'H-1' }, body: {} }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(400)
    expect(db.select).toHaveBeenCalledTimes(1)
  })

  it('sets completion time for completed handoffs and resolves a changed owner', async () => {
    const res = mockResponse()
    const handoff = { id: 'H-1', operationId: 'OP-1', fromDepartmentRole: 'A', toDepartmentRole: 'B' }
    const operation = { id: 'OP-1' }
    selectLimit([handoff]); selectLimit([operation])
    const set = mockUpdate()

    await controller.updateTurnaroundHandoff({ params: { id: handoff.id }, body: { status: 'COMPLETE', ownerName: 'Alex' } }, res, jest.fn())

    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETE', ownerName: 'Alex', ownerUserId: 'USR-1', completedAt: expect.any(String) }))
    expect(mutationSupport.recordTurnaroundAuditEvent).toHaveBeenCalledWith(expect.anything(), operation, expect.objectContaining({ eventType: 'TURNAROUND_HANDOFF_UPDATED' }))
  })

  it('clears completion time when a completed handoff is reopened', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'H-1', operationId: 'OP-1' }]); selectLimit([{ id: 'OP-1' }])
    const set = mockUpdate()
    await controller.updateTurnaroundHandoff({ params: { id: 'H-1' }, body: { status: 'OPEN' } }, res, jest.fn())
    expect(set).toHaveBeenCalledWith({ status: 'OPEN', completedAt: null })
  })

  it('covers staffing create and signoff update paths with normalized nullable values', async () => {
    const res1 = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([])
    const { values } = mockInsert([{ id: 'ST-CREATED' }])
    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { plannedCount: '', checkedInCount: 3, leadName: '' } }, res1, jest.fn())
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ plannedCount: 0, checkedInCount: 3, leadName: null }))
    expect(mutationSupport.recordTurnaroundAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ entityId: 'ST-CREATED' }))

    const res2 = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([{ id: 'S-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }])
    const set = mockUpdate()
    await controller.updateTurnaroundSignoff({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { status: 'PENDING', approverName: 'Alex', notes: '' } }, res2, jest.fn())
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING', signedAt: null, approverUserId: 'USR-1', notes: null }))
  })



  it('fails closed when existing staffing disappears before update', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([{ id: 'ST-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }])
    mockUpdate([])

    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { plannedCount: 4, checkedInCount: 2 } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })

  it('fails closed when an existing signoff disappears before update', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([{ id: 'S-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }])
    mockUpdate([])

    await controller.updateTurnaroundSignoff({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { status: 'APPROVED', approverName: 'Alex' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })

  it('normalizes malformed staffing counts and prevents non-finite operational evidence', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([])
    const { values } = mockInsert([{ id: 'ST-CREATED' }])

    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { plannedCount: 'bad', checkedInCount: Infinity } }, res, jest.fn())

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ plannedCount: 0, checkedInCount: 0 }))
  })

  it('fails closed when a handoff disappears between authorization and update', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'H-1', operationId: 'OP-1', fromDepartmentRole: 'A', toDepartmentRole: 'B' }]); selectLimit([{ id: 'OP-1' }])
    mockUpdate([])

    await controller.updateTurnaroundHandoff({ params: { id: 'H-1' }, body: { status: 'COMPLETE' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })



  it('covers staffing not-found and forbidden paths without mutating workforce evidence', async () => {
    const missingRes = mockResponse()
    selectLimit([])
    await controller.updateTurnaroundStaffing({ params: { id: 'MISSING', departmentRole: 'ENGINEERING' }, body: { plannedCount: 1, checkedInCount: 1 } }, missingRes, jest.fn())
    expect(missingRes.status).toHaveBeenCalledWith(404)

    const forbiddenRes = mockResponse()
    selectLimit([{ id: 'OP-1' }])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValueOnce(false)
    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { plannedCount: 1, checkedInCount: 1 } }, forbiddenRes, jest.fn())
    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(forbiddenRes)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('records the generated staffing id and fails closed when creation returns no row', async () => {
    const successRes = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([])
    mockInsert([{ id: 'STAFF-NEW' }])
    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'SECURITY' }, body: { plannedCount: 2, checkedInCount: 1 } }, successRes, jest.fn())
    expect(mutationSupport.recordTurnaroundAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({
      entityId: 'STAFF-NEW',
      eventPayload: expect.objectContaining({ entityRefs: expect.objectContaining({ staffingId: 'STAFF-NEW' }) })
    }))

    jest.clearAllMocks()
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
    const failedRes = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([])
    mockInsert([])
    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'SECURITY' }, body: { plannedCount: 2, checkedInCount: 1 } }, failedRes, jest.fn())
    expect(failedRes.status).toHaveBeenCalledWith(500)
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })

  it('covers signoff not-found, forbidden, create, and create-failure paths', async () => {
    const missingRes = mockResponse()
    selectLimit([])
    await controller.updateTurnaroundSignoff({ params: { id: 'MISSING', departmentRole: 'ENGINEERING' }, body: { status: 'PENDING', approverName: 'Alex' } }, missingRes, jest.fn())
    expect(missingRes.status).toHaveBeenCalledWith(404)

    const forbiddenRes = mockResponse()
    selectLimit([{ id: 'OP-1' }])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValueOnce(false)
    await controller.updateTurnaroundSignoff({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { status: 'PENDING', approverName: 'Alex' } }, forbiddenRes, jest.fn())
    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(forbiddenRes)

    jest.clearAllMocks()
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
    mutationSupport.resolveOperationalUserIdByName.mockResolvedValue('USR-1')
    getTurnaroundOperationDetails.mockResolvedValue({ id: 'OP-1' })
    const createdRes = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([])
    mockInsert([{ id: 'SIGNOFF-NEW' }])
    await controller.updateTurnaroundSignoff({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { status: 'APPROVED', approverName: 'Alex' } }, createdRes, jest.fn())
    expect(mutationSupport.recordTurnaroundAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ entityId: 'SIGNOFF-NEW' }))

    jest.clearAllMocks()
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
    mutationSupport.resolveOperationalUserIdByName.mockResolvedValue('USR-1')
    const failedRes = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([])
    mockInsert([])
    await controller.updateTurnaroundSignoff({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { status: 'APPROVED', approverName: 'Alex' } }, failedRes, jest.fn())
    expect(failedRes.status).toHaveBeenCalledWith(500)
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })

  it('covers handoff missing, forbidden, and error-middleware branches', async () => {
    const missingRes = mockResponse()
    selectLimit([])
    await controller.updateTurnaroundHandoff({ params: { id: 'H-MISSING' }, body: { status: 'COMPLETE' } }, missingRes, jest.fn())
    expect(missingRes.status).toHaveBeenCalledWith(404)

    const forbiddenRes = mockResponse()
    selectLimit([{ id: 'H-1', operationId: 'OP-1' }]); selectLimit([{ id: 'OP-1' }])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValueOnce(false)
    await controller.updateTurnaroundHandoff({ params: { id: 'H-1' }, body: { status: 'COMPLETE' } }, forbiddenRes, jest.fn())
    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(forbiddenRes)

    jest.clearAllMocks()
    const error = new Error('handoff read failed')
    const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })
    await controller.updateTurnaroundHandoff({ params: { id: 'H-1' }, body: { status: 'OPEN' } }, mockResponse(), next)
    expect(next).toHaveBeenCalledWith(error)
  })

  it('forwards signoff database failures', async () => {
    const error = new Error('signoff read failed')
    const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })
    await controller.updateTurnaroundSignoff({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { status: 'PENDING', approverName: 'Alex' } }, mockResponse(), next)
    expect(next).toHaveBeenCalledWith(error)
  })

  it('forwards database failures', async () => {
    const error = new Error('db failed')
    const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })
    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: {} }, mockResponse(), next)
    expect(next).toHaveBeenCalledWith(error)
  })
})
