jest.mock('../../db', () => ({
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn()
}))
jest.mock('drizzle-orm', () => ({ eq: jest.fn((field, value) => ({ field, value })) }), { virtual: true })
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
const { createTurnaroundEscalationController } = require('../../controllers/turnaroundEscalation.controller')
const mockResponse = require('./helpers/mockResponse')

const getTurnaroundOperationDetails = jest.fn()
const controller = createTurnaroundEscalationController({ getTurnaroundOperationDetails })

function selectLimit(result) {
  const limit = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ limit })
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
}

beforeEach(() => {
  jest.clearAllMocks()
  scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
  mutationSupport.resolveOperationalUserIdByName.mockResolvedValue('USR-1')
  getTurnaroundOperationDetails.mockResolvedValue({ id: 'OP-1', decorated: true })
})

describe('turnaround escalation controller', () => {
  it('requires a turnaround detail resolver', () => {
    expect(() => createTurnaroundEscalationController({})).toThrow('getTurnaroundOperationDetails is required')
  })

  it('returns 404 when creating an escalation for a missing operation', async () => {
    const res = mockResponse()
    selectLimit([])

    await controller.createTurnaroundEscalation({ params: { id: 'missing' }, body: {} }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('denies escalation creation outside the authorized turnaround scope', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'OP-1' }])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)

    await controller.createTurnaroundEscalation({ params: { id: 'OP-1' }, body: { title: 'Delay' } }, res, jest.fn())

    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(res)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('resolves the owner identity exactly once and reuses it for persistence and audit history', async () => {
    const res = mockResponse()
    const operation = { id: 'OP-1', sailingId: 'S-1' }
    const values = jest.fn().mockResolvedValue()
    db.insert.mockReturnValue({ values })
    selectLimit([operation])

    await controller.createTurnaroundEscalation({
      params: { id: operation.id },
      body: { departmentRole: 'ENGINEERING', title: 'Generator watch', ownerName: 'Morgan Lee' }
    }, res, jest.fn())

    expect(mutationSupport.resolveOperationalUserIdByName).toHaveBeenCalledTimes(1)
    expect(mutationSupport.resolveOperationalUserIdByName).toHaveBeenCalledWith('Morgan Lee', operation)
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      ownerName: 'Morgan Lee',
      ownerUserId: 'USR-1',
      severity: 'WATCH',
      status: 'OPEN',
      resolutionNotes: null
    }))
    expect(mutationSupport.buildTurnaroundHistoryPayload).toHaveBeenCalledWith(expect.objectContaining({
      next: expect.objectContaining({ ownerUserId: 'USR-1' })
    }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('persists nullable owner and resolution details without inventing an identity', async () => {
    const res = mockResponse()
    const operation = { id: 'OP-1' }
    const values = jest.fn().mockResolvedValue()
    db.insert.mockReturnValue({ values })
    selectLimit([operation])
    mutationSupport.resolveOperationalUserIdByName.mockResolvedValue(null)

    await controller.createTurnaroundEscalation({
      params: { id: operation.id },
      body: { departmentRole: 'GUEST_SERVICES', title: 'Queue watch', ownerName: '', resolutionNotes: '' }
    }, res, jest.fn())

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ ownerName: null, ownerUserId: null, resolutionNotes: null }))
  })

  it('returns 400 when an escalation update contains no mutable fields', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'ESC-1', operationId: 'OP-1' }])

    await controller.updateTurnaroundEscalation({ params: { id: 'ESC-1' }, body: { ignored: true } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('returns 404 when the escalation being updated does not exist', async () => {
    const res = mockResponse()
    selectLimit([])

    await controller.updateTurnaroundEscalation({ params: { id: 'ESC-X' }, body: { status: 'RESOLVED' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('updates owner identity and returns an operation snapshot when the operation exists', async () => {
    const res = mockResponse()
    const escalation = { id: 'ESC-1', operationId: 'OP-1', departmentRole: 'ENGINEERING', ownerName: 'Old' }
    const operation = { id: 'OP-1' }
    selectLimit([escalation])
    selectLimit([operation])
    const where = jest.fn().mockResolvedValue()
    const set = jest.fn().mockReturnValue({ where })
    db.update.mockReturnValue({ set })

    await controller.updateTurnaroundEscalation({
      params: { id: escalation.id },
      body: { ownerName: 'New Owner', status: 'RESOLVED', resolutionNotes: 'Cleared' }
    }, res, jest.fn())

    expect(set).toHaveBeenCalledWith(expect.objectContaining({ ownerName: 'New Owner', ownerUserId: 'USR-1', status: 'RESOLVED' }))
    expect(mutationSupport.recordTurnaroundAuditEvent).toHaveBeenCalledWith(expect.anything(), operation, expect.objectContaining({
      eventType: 'TURNAROUND_ESCALATION_UPDATED'
    }))
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ operation: { id: 'OP-1', decorated: true } }))
  })

  it('skips owner lookup and returns no operation snapshot when the parent operation has been removed', async () => {
    const res = mockResponse()
    const escalation = { id: 'ESC-2', operationId: 'missing', departmentRole: 'ENGINEERING' }
    selectLimit([escalation])
    selectLimit([])
    const where = jest.fn().mockResolvedValue()
    const set = jest.fn().mockReturnValue({ where })
    db.update.mockReturnValue({ set })

    await controller.updateTurnaroundEscalation({ params: { id: escalation.id }, body: { status: 'OPEN' } }, res, jest.fn())

    expect(mutationSupport.resolveOperationalUserIdByName).not.toHaveBeenCalled()
    expect(getTurnaroundOperationDetails).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ message: 'Turnaround escalation updated successfully', operation: undefined })
  })

  it('forwards persistence failures', async () => {
    const error = new Error('select failed')
    const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })

    await controller.updateTurnaroundEscalation({ params: { id: 'ESC-1' }, body: { status: 'OPEN' } }, mockResponse(), next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
