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
function mockUpdate() {
  const where = jest.fn().mockResolvedValue()
  const set = jest.fn().mockReturnValue({ where })
  db.update.mockReturnValueOnce({ set })
  return set
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
    const values = jest.fn().mockResolvedValue()
    db.insert.mockReturnValueOnce({ values })
    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { plannedCount: '', checkedInCount: 3, leadName: '' } }, res1, jest.fn())
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ plannedCount: 0, checkedInCount: 3, leadName: null }))

    const res2 = mockResponse()
    selectLimit([{ id: 'OP-1' }]); selectLimit([{ id: 'S-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }])
    const set = mockUpdate()
    await controller.updateTurnaroundSignoff({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: { status: 'PENDING', approverName: 'Alex', notes: '' } }, res2, jest.fn())
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING', signedAt: null, approverUserId: 'USR-1', notes: null }))
  })

  it('forwards database failures', async () => {
    const error = new Error('db failed')
    const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })
    await controller.updateTurnaroundStaffing({ params: { id: 'OP-1', departmentRole: 'ENGINEERING' }, body: {} }, mockResponse(), next)
    expect(next).toHaveBeenCalledWith(error)
  })
})
