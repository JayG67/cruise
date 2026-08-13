jest.mock('../../services/auditEvent.service', () => ({ listAuditEvents: jest.fn() }))
jest.mock('../../services/auditEventQuery.service', () => ({
  buildAuditEventListResponse: jest.fn((events, contract) => ({ auditEvents: events, ...contract })),
  buildAuditEventQueryContract: jest.fn((query = {}, options = {}) => ({ filters: query, limit: options.defaultLimit || 50 }))
}))
jest.mock('../../services/platformAudit.service', () => ({ recordPlatformAuditEvent: jest.fn() }))
jest.mock('../../services/turnaroundAdminSetup.service', () => ({
  buildTurnaroundSetupSummary: jest.fn(),
  createTurnaroundPerson: jest.fn(),
  updateTurnaroundPerson: jest.fn(),
  deleteTurnaroundPerson: jest.fn()
}))
jest.mock('../../services/requestAuthorization.service', () => ({ requireAdminRequest: jest.fn() }))

const { listAuditEvents } = require('../../services/auditEvent.service')
const { recordPlatformAuditEvent } = require('../../services/platformAudit.service')
const setup = require('../../services/turnaroundAdminSetup.service')
const { requireAdminRequest } = require('../../services/requestAuthorization.service')
const controller = require('../../controllers/platformOperationsAdmin.controller')

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
}

describe('platformOperationsAdmin controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireAdminRequest.mockResolvedValue(true)
    setup.buildTurnaroundSetupSummary.mockResolvedValue({ people: [] })
  })

  it('short-circuits admin setup reads when authorization fails', async () => {
    requireAdminRequest.mockResolvedValue(false)
    const res = response()
    await controller.getTurnaroundAdminSetup({}, res, jest.fn())
    expect(setup.buildTurnaroundSetupSummary).not.toHaveBeenCalled()
  })

  it('returns turnaround setup and forwards unexpected read errors', async () => {
    const res = response()
    await controller.getTurnaroundAdminSetup({}, res, jest.fn())
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ people: [] })

    const next = jest.fn()
    setup.buildTurnaroundSetupSummary.mockRejectedValueOnce(new Error('setup failed'))
    await controller.getTurnaroundAdminSetup({}, response(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'setup failed' }))
  })

  it.each([
    ['createTurnaroundPerson', 'createTurnaroundPerson', 201, 'TURNAROUND_PERSON_CREATED'],
    ['updateTurnaroundPerson', 'updateTurnaroundPerson', 200, 'TURNAROUND_PERSON_UPDATED'],
    ['deleteTurnaroundPerson', 'deleteTurnaroundPerson', 200, 'TURNAROUND_PERSON_UNASSIGNED']
  ])('executes %s with attributed audit evidence', async (handler, serviceMethod, expectedStatus, eventType) => {
    const person = { id: 'person-1', displayName: 'Ops Lead', role: 'TURNAROUND_MANAGER', cruiseLineId: 'CL-1', assignedShipId: 'SHIP-1' }
    setup[serviceMethod].mockResolvedValue(person)
    const req = { body: { displayName: 'Ops Lead' }, params: { id: 'person-1' } }
    const res = response()

    await controller[handler](req, res, jest.fn())

    expect(res.statusCode).toBe(expectedStatus)
    expect(recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      eventType,
      entityId: 'person-1',
      cruiseLineId: 'CL-1',
      shipId: 'SHIP-1'
    }))
    expect(setup.buildTurnaroundSetupSummary).toHaveBeenCalled()
  })

  it('returns service client errors and forwards unexpected mutation errors', async () => {
    setup.createTurnaroundPerson.mockRejectedValueOnce(Object.assign(new Error('invalid setup'), { statusCode: 422 }))
    const clientRes = response()
    await controller.createTurnaroundPerson({ body: {} }, clientRes, jest.fn())
    expect(clientRes.statusCode).toBe(422)
    expect(clientRes.body).toEqual({ message: 'invalid setup' })

    setup.updateTurnaroundPerson.mockRejectedValueOnce(new Error('database failed'))
    const next = jest.fn()
    await controller.updateTurnaroundPerson({ params: { id: 'x' }, body: {} }, response(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'database failed' }))
  })

  it('lists tenant-constrained audit events and forwards list errors', async () => {
    listAuditEvents.mockResolvedValue([{ id: 'audit-1' }])
    const req = { query: { entityType: 'BOOKING' }, tenantAuditFilters: { cruiseLineId: 'CL-1' } }
    const res = response()
    await controller.getPlatformAuditEvents(req, res, jest.fn())
    expect(res.statusCode).toBe(200)
    expect(listAuditEvents).toHaveBeenCalledWith({ cruiseLineId: 'CL-1' }, { limit: 50 })
    expect(res.body.auditEvents).toEqual([{ id: 'audit-1' }])

    listAuditEvents.mockRejectedValueOnce(new Error('audit read failed'))
    const next = jest.fn()
    await controller.getPlatformAuditEvents({ query: {} }, response(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'audit read failed' }))
  })
})
