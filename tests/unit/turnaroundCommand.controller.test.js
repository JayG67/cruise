jest.mock('../../db', () => ({ select: jest.fn(), update: jest.fn() }))
jest.mock('drizzle-orm', () => ({ eq: jest.fn((field, value) => ({ field, value })) }), { virtual: true })
jest.mock('../../services/turnaroundScope.service', () => ({
  canAccessTurnaroundOperationForRequest: jest.fn(),
  sendTurnaroundOperationForbidden: jest.fn((res) => res.status(403).json({ message: 'Forbidden' }))
}))
jest.mock('../../services/turnaroundMutationSupport.service', () => ({
  buildTurnaroundHistoryPayload: jest.fn((value) => value),
  mergeTurnaroundEntity: jest.fn((previous, updates) => ({ ...previous, ...updates })),
  recordTurnaroundAuditEvent: jest.fn()
}))

const db = require('../../db')
const scope = require('../../services/turnaroundScope.service')
const mutationSupport = require('../../services/turnaroundMutationSupport.service')
const { createTurnaroundCommandController } = require('../../controllers/turnaroundCommand.controller')
const mockResponse = require('./helpers/mockResponse')

const getTurnaroundOperationDetails = jest.fn()
const controller = createTurnaroundCommandController({ getTurnaroundOperationDetails })

function selectLimit(result) {
  const limit = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ limit })
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
}

function updateReturning(result) {
  const returning = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ returning })
  const set = jest.fn().mockReturnValue({ where })
  db.update.mockReturnValueOnce({ set })
  return { set, where, returning }
}

beforeEach(() => {
  jest.clearAllMocks()
  scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
  getTurnaroundOperationDetails.mockResolvedValue({ id: 'OP-1', decorated: true })
})

describe('turnaround command controller defect-discovery coverage', () => {
  it('requires the operation detail resolver', () => {
    expect(() => createTurnaroundCommandController({})).toThrow('getTurnaroundOperationDetails is required')
  })

  it('returns 404 before authorization or mutation when the operation does not exist', async () => {
    const res = mockResponse()
    selectLimit([])

    await controller.updateTurnaroundOperationCommand({ params: { id: 'MISSING' }, body: { status: 'READY' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(scope.canAccessTurnaroundOperationForRequest).not.toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })

  it('denies command mutation outside the authorized turnaround scope', async () => {
    const res = mockResponse()
    const operation = { id: 'OP-1', status: 'READY' }
    selectLimit([operation])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)

    await controller.updateTurnaroundOperationCommand({ params: { id: operation.id }, body: { notes: 'No access' } }, res, jest.fn())

    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(res)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('rejects an empty command patch after scope authorization', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'OP-1' }])

    await controller.updateTurnaroundOperationCommand({ params: { id: 'OP-1' }, body: {} }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('updates allowed command fields, normalizes an empty note to null, and audits before/after history', async () => {
    const res = mockResponse()
    const operation = {
      id: 'OP-1',
      sailingId: 'SAIL-1',
      status: 'READY',
      readinessLevel: 'Watch',
      port: 'Miami',
      notes: 'Old note'
    }
    const updatedOperation = {
      ...operation,
      status: 'IN_PROGRESS',
      readinessLevel: 'Active',
      port: 'PortMiami',
      notes: null
    }
    selectLimit([operation])
    const update = updateReturning([updatedOperation])

    await controller.updateTurnaroundOperationCommand({
      params: { id: operation.id },
      body: {
        status: 'IN_PROGRESS',
        readinessLevel: 'Active',
        port: 'PortMiami',
        notes: '',
        ignored: 'not persisted'
      }
    }, res, jest.fn())

    expect(update.set).toHaveBeenCalledWith({
      status: 'IN_PROGRESS',
      readinessLevel: 'Active',
      port: 'PortMiami',
      notes: null
    })
    expect(mutationSupport.mergeTurnaroundEntity).toHaveBeenCalledWith({
      status: 'READY', readinessLevel: 'Watch', port: 'Miami', notes: 'Old note'
    }, {
      status: 'IN_PROGRESS', readinessLevel: 'Active', port: 'PortMiami', notes: null
    })
    expect(mutationSupport.recordTurnaroundAuditEvent).toHaveBeenCalledWith(expect.anything(), operation, expect.objectContaining({
      eventType: 'TURNAROUND_COMMAND_UPDATED',
      entityType: 'TURNAROUND_OPERATION',
      entityId: operation.id,
      eventPayload: expect.objectContaining({
        previous: expect.objectContaining({ status: 'READY', notes: 'Old note' }),
        next: expect.objectContaining({ status: 'IN_PROGRESS', notes: null }),
        entityRefs: { turnaroundOperationId: operation.id },
        metadata: { action: 'update-command-plan' }
      })
    }))
    expect(getTurnaroundOperationDetails).toHaveBeenCalledWith(updatedOperation)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('fails closed when the authorized operation disappears before the update and does not create a phantom audit event', async () => {
    const res = mockResponse()
    const operation = { id: 'OP-1', status: 'READY' }
    selectLimit([operation])
    updateReturning([])

    await controller.updateTurnaroundOperationCommand({ params: { id: operation.id }, body: { status: 'IN_PROGRESS' } }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Turnaround operation no longer exists' })
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
    expect(getTurnaroundOperationDetails).not.toHaveBeenCalled()
  })

  it('forwards persistence failures without reporting command success', async () => {
    const error = new Error('update failed')
    const next = jest.fn()
    selectLimit([{ id: 'OP-1', status: 'READY' }])
    const returning = jest.fn().mockRejectedValue(error)
    const where = jest.fn().mockReturnValue({ returning })
    db.update.mockReturnValueOnce({ set: jest.fn().mockReturnValue({ where }) })
    const res = mockResponse()

    await controller.updateTurnaroundOperationCommand({ params: { id: 'OP-1' }, body: { status: 'IN_PROGRESS' } }, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalledWith(200)
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })

  it('forwards audit failures instead of returning an unaudited success response', async () => {
    const error = new Error('audit failed')
    const next = jest.fn()
    const operation = { id: 'OP-1', status: 'READY' }
    selectLimit([operation])
    updateReturning([{ ...operation, status: 'IN_PROGRESS' }])
    mutationSupport.recordTurnaroundAuditEvent.mockRejectedValueOnce(error)
    const res = mockResponse()

    await controller.updateTurnaroundOperationCommand({ params: { id: operation.id }, body: { status: 'IN_PROGRESS' } }, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(getTurnaroundOperationDetails).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalledWith(200)
  })
})
