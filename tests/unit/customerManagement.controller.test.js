jest.mock('../../db', () => ({ select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() }))
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value })),
  inArray: jest.fn((field, values) => ({ field, values }))
}), { virtual: true })
jest.mock('../../services/authentication.service', () => ({
  AUTH_MODES: { DEMO: 'demo', JWT: 'jwt' },
  getAuthenticationMode: jest.fn()
}))
jest.mock('../../services/platformAudit.service', () => ({ recordPlatformAuditEvent: jest.fn() }))
jest.mock('../../services/entityHistory.service', () => ({
  buildEntityHistoryPayload: jest.fn(value => value),
  buildEntityLifecycleTimestamps: jest.fn(() => ({ createdAt: 'now', updatedAt: 'now' })),
  buildEntityUpdateTimestamp: jest.fn(() => ({ updatedAt: 'later' }))
}))
jest.mock('../../services/apiIdentityBridge.service', () => ({
  withCustomerApiIdentity: jest.fn(value => value),
  withPreCruiseChecklistApiIdentity: jest.fn(value => value)
}))
jest.mock('../../services/apiPayloadProfile.service', () => ({
  applyCustomerPayloadProfile: jest.fn(value => value),
  getRequestedPayloadProfile: jest.fn(() => 'full')
}))
jest.mock('../../services/customerTenantAccess.service', () => ({ filterCustomersForAdminTenant: jest.fn() }))

const db = require('../../db')
const authentication = require('../../services/authentication.service')
const audit = require('../../services/platformAudit.service')
const tenantAccess = require('../../services/customerTenantAccess.service')
const controller = require('../../controllers/customerManagement.controller')
const mockResponse = require('./helpers/mockResponse')

function selectAll(result) {
  db.select.mockReturnValueOnce({ from: jest.fn().mockResolvedValue(result) })
}

function selectLimit(result) {
  const limit = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ limit })
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
}

function selectWhere(result) {
  const where = jest.fn().mockResolvedValue(result)
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
}

function insertValues() {
  const values = jest.fn().mockResolvedValue()
  db.insert.mockReturnValueOnce({ values })
  return values
}

function updateReturning(result) {
  const returning = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ returning })
  const set = jest.fn().mockReturnValue({ where })
  db.update.mockReturnValueOnce({ set })
  return set
}

function updateWhere() {
  const where = jest.fn().mockResolvedValue()
  const set = jest.fn().mockReturnValue({ where })
  db.update.mockReturnValueOnce({ set })
}

function deleteWhere() {
  db.delete.mockReturnValueOnce({ where: jest.fn().mockResolvedValue() })
}

beforeEach(() => {
  jest.clearAllMocks()
  authentication.getAuthenticationMode.mockReturnValue(authentication.AUTH_MODES.DEMO)
  tenantAccess.filterCustomersForAdminTenant.mockImplementation(async (_req, rows) => rows)
})

describe('customer management controller defect-discovery coverage', () => {
  it('returns 404 when the customer list is empty', async () => {
    const res = mockResponse()
    selectAll([])
    await controller.getCustomers({}, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('filters production customers and supplies default checklist state', async () => {
    authentication.getAuthenticationMode.mockReturnValue(authentication.AUTH_MODES.JWT)
    const all = [{ id: 'C1' }, { id: 'C2' }]
    tenantAccess.filterCustomersForAdminTenant.mockResolvedValue([all[1]])
    selectAll(all); selectWhere([])
    const res = mockResponse()
    await controller.getCustomers({ query: {} }, res, jest.fn())
    expect(tenantAccess.filterCustomersForAdminTenant).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith([expect.objectContaining({ id: 'C2', preCruiseChecklist: expect.objectContaining({ documents: false }) })])
  })

  it('returns one customer with a persisted checklist', async () => {
    selectLimit([{ id: 'C1', firstName: 'Ada' }]); selectWhere([{ customerId: 'C1', documents: 1, checklistUuid: 'U1' }])
    const res = mockResponse()
    await controller.getCustomerById({ params: { id: 'C1' } }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ preCruiseChecklist: expect.objectContaining({ documents: true }) }))
  })

  it('rejects duplicate customer ids and duplicate emails', async () => {
    const body = { id: 'C1', email: 'a@example.com' }
    const res1 = mockResponse(); selectLimit([{ id: 'C1' }])
    await controller.insertCustomer({ body }, res1, jest.fn())
    expect(res1.status).toHaveBeenCalledWith(400)

    const res2 = mockResponse(); selectLimit([]); selectLimit([{ id: 'C2' }])
    await controller.insertCustomer({ body }, res2, jest.fn())
    expect(res2.status).toHaveBeenCalledWith(400)
  })

  it('creates a customer and records audit evidence', async () => {
    selectLimit([]); selectLimit([]); const values = insertValues(); const res = mockResponse()
    await controller.insertCustomer({ body: { id: 'C1', firstName: 'Ada', lastName: 'L', email: 'a@example.com' } }, res, jest.fn())
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ id: 'C1', createdAt: 'now' }))
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: 'CUSTOMER_CREATED' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('fails closed when a customer disappears between authorization read and update', async () => {
    selectLimit([{ id: 'C1', email: 'old@example.com' }]); updateReturning([])
    const res = mockResponse()
    await controller.updateCustomer({ params: { id: 'C1' }, body: { email: 'new@example.com' } }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(404)
    expect(audit.recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('updates an existing customer using the database-confirmed mutation', async () => {
    selectLimit([{ id: 'C1', email: 'old@example.com' }]); const set = updateReturning([{ id: 'C1' }]); const res = mockResponse()
    await controller.updateCustomer({ params: { id: 'C1' }, body: { firstName: 'Ada', lastName: 'L', email: 'new@example.com', phone: null, loyaltyNumber: null } }, res, jest.fn())
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com', updatedAt: 'later' }))
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: 'CUSTOMER_UPDATED' }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('deletes related customer records before recording deletion audit evidence', async () => {
    selectLimit([{ id: 'C1', email: 'a@example.com' }]); updateWhere(); deleteWhere(); deleteWhere(); const res = mockResponse()
    await controller.deleteCustomer({ params: { id: 'C1' } }, res, jest.fn())
    expect(db.delete).toHaveBeenCalledTimes(2)
    expect(audit.recordPlatformAuditEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: 'CUSTOMER_DELETED' }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('forwards persistence errors to error middleware', async () => {
    const error = new Error('db failed'); const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })
    await controller.getCustomerById({ params: { id: 'C1' } }, mockResponse(), next)
    expect(next).toHaveBeenCalledWith(error)
  })
})
