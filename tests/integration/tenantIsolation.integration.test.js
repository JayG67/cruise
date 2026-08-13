const crypto = require('crypto')
const request = require('supertest')
const { eq } = require('drizzle-orm')

const app = require('../../app')
const db = require('../../db')
const {
  activityScheduleTable,
  appUserRoleTable,
  appUserTable,
  auditEventTable,
  cruiseLineTable,
  itineraryDayTable,
  sailingTable,
  shipTable
} = require('../../models')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')
const { recordAuditEvent } = require('../../services/auditEvent.service')

const ORIGINAL_AUTH_MODE = process.env.CRUISE_AUTH_MODE
const ORIGINAL_JWT_SECRET = process.env.CRUISE_JWT_SECRET
const JWT_SECRET = 'tenant-isolation-security-secret-32-byte-minimum'
const TENANT_ADMIN_ID = 'tenant-admin-security-test'
const TENANT_ROLE_ID = `${TENANT_ADMIN_ID}-admin`
const AUDIT_SOURCE = 'TENANT_ISOLATION_SECURITY_TEST'

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url')
  return `${signingInput}.${signature}`
}

function bearer(tenantId) {
  const now = Math.floor(Date.now() / 1000)
  return `Bearer ${signToken({ sub: TENANT_ADMIN_ID, role: 'ADMIN', tenantId, name: 'Tenant Admin Security Test', exp: now + 300 })}`
}

let ownLine
let otherLine
let ownShip
let otherShip
let ownSailing
let otherSailing

beforeAll(async () => {
  process.env.CRUISE_AUTH_MODE = 'jwt'
  process.env.CRUISE_JWT_SECRET = JWT_SECRET
  await initializeDatabase()
  await loadCruiseData()

  const lines = await db.select().from(cruiseLineTable)
  if (lines.length < 2) throw new Error('Tenant isolation tests require at least two seeded cruise lines')
  ;[ownLine, otherLine] = lines

  ownShip = (await db.select().from(shipTable).where(eq(shipTable.cruiseLineId, ownLine.id)).limit(1))[0]
  otherShip = (await db.select().from(shipTable).where(eq(shipTable.cruiseLineId, otherLine.id)).limit(1))[0]
  ownSailing = (await db.select().from(sailingTable).where(eq(sailingTable.shipId, ownShip.id)).limit(1))[0]
  otherSailing = (await db.select().from(sailingTable).where(eq(sailingTable.shipId, otherShip.id)).limit(1))[0]

  await db.insert(appUserTable).values({
    id: TENANT_ADMIN_ID,
    displayName: 'Tenant Admin Security Test',
    email: `${TENANT_ADMIN_ID}@cruise-explorer.local`,
    userType: 'EMPLOYEE',
    primaryCustomerId: null,
    cruiseLineId: ownLine.id,
    assignedShipId: null,
    status: 'ACTIVE'
  }).onConflictDoNothing()

  await db.insert(appUserRoleTable).values({
    id: TENANT_ROLE_ID,
    userId: TENANT_ADMIN_ID,
    roleId: 'admin',
    assignmentScope: 'CRUISE_LINE',
    cruiseLineId: ownLine.id,
    assignedShipId: null,
    status: 'ACTIVE'
  }).onConflictDoNothing()

  global.registerDatabaseCleanup(async () => {
    await db.delete(auditEventTable).where(eq(auditEventTable.source, AUDIT_SOURCE))
    await db.delete(appUserRoleTable).where(eq(appUserRoleTable.id, TENANT_ROLE_ID))
    await db.delete(appUserTable).where(eq(appUserTable.id, TENANT_ADMIN_ID))
  })
})

afterAll(() => {
  if (ORIGINAL_AUTH_MODE === undefined) delete process.env.CRUISE_AUTH_MODE
  else process.env.CRUISE_AUTH_MODE = ORIGINAL_AUTH_MODE
  if (ORIGINAL_JWT_SECRET === undefined) delete process.env.CRUISE_JWT_SECRET
  else process.env.CRUISE_JWT_SECRET = ORIGINAL_JWT_SECRET
})

describe('production cruise-line tenant isolation', () => {
  it('allows a tenant admin to reach validation for its own line but blocks another line', async () => {
    const token = bearer(ownLine.id)
    const own = await request(app).patch(`/cruise/cruise-line/${ownLine.id}`).set('Authorization', token).send({})
    const other = await request(app).patch(`/cruise/cruise-line/${otherLine.id}`).set('Authorization', token).send({})

    expect(own.statusCode).toBe(400)
    expect(other.statusCode).toBe(403)
  })

  it('does not allow a tenant-scoped admin to create a new cruise-line tenant', async () => {
    const response = await request(app)
      .post('/cruise/cruise-line')
      .set('Authorization', bearer(ownLine.id))
      .send({ name: `Cross tenant ${Date.now()}`, country: 'US', website: 'https://example.com' })

    expect(response.statusCode).toBe(403)
    expect(response.body.message).toMatch(/global administrator/i)
  })

  it('blocks cross-tenant ship and sailing mutation before payload validation', async () => {
    const token = bearer(ownLine.id)
    const ownShipResponse = await request(app).patch(`/cruise/ship/${ownShip.id}`).set('Authorization', token).send({ cruiseLineId: ownLine.id })
    const otherShipResponse = await request(app).patch(`/cruise/ship/${otherShip.id}`).set('Authorization', token).send({})
    const ownSailingResponse = await request(app).patch(`/cruise/sailings/${ownSailing.id}`).set('Authorization', token).send({})
    const otherSailingResponse = await request(app).patch(`/cruise/sailings/${otherSailing.id}`).set('Authorization', token).send({})

    expect(ownShipResponse.statusCode).toBe(400)
    expect(otherShipResponse.statusCode).toBe(403)
    expect(ownSailingResponse.statusCode).toBe(400)
    expect(otherSailingResponse.statusCode).toBe(403)
  })

  it('prevents moving an owned ship into another cruise-line tenant', async () => {
    const response = await request(app)
      .patch(`/cruise/ship/${ownShip.id}`)
      .set('Authorization', bearer(ownLine.id))
      .send({ name: ownShip.name, currentPort: ownShip.currentPort, cruiseLineId: otherLine.id })

    expect(response.statusCode).toBe(403)
  })

  it('blocks cross-tenant itinerary and activity resources before controller mutation', async () => {
    const token = bearer(ownLine.id)
    const otherDays = await db.select().from(itineraryDayTable).where(eq(itineraryDayTable.sailingId, otherSailing.id))
    let otherDay = null
    let otherActivity = null
    for (const day of otherDays) {
      const activity = (await db.select().from(activityScheduleTable).where(eq(activityScheduleTable.itineraryDayId, day.id)).limit(1))[0]
      if (activity) {
        otherDay = day
        otherActivity = activity
        break
      }
    }
    expect(otherDay).toBeTruthy()
    expect(otherActivity).toBeTruthy()

    const otherDayResponse = await request(app).patch(`/cruise/itinerary-days/${otherDay.id}`).set('Authorization', token).send({})
    const otherActivityResponse = await request(app).patch(`/cruise/activities/${otherActivity.id}`).set('Authorization', token).send({})

    expect(otherDayResponse.statusCode).toBe(403)
    expect(otherActivityResponse.statusCode).toBe(403)
  })

  it('rejects a tenant claim that conflicts with the server-side role assignment', async () => {
    const response = await request(app)
      .patch(`/cruise/cruise-line/${ownLine.id}`)
      .set('Authorization', bearer(otherLine.id))
      .send({})

    expect(response.statusCode).toBe(403)
  })

  it('scopes platform audit reads to the authenticated tenant and rejects a cross-tenant filter', async () => {
    await recordAuditEvent({
      eventType: 'TENANT_TEST', entityType: 'CRUISE_LINE', entityId: ownLine.id,
      actorUserId: TENANT_ADMIN_ID, actorDisplayName: 'Tenant Admin Security Test', cruiseLineId: ownLine.id,
      source: AUDIT_SOURCE, createdAt: new Date().toISOString()
    })
    await recordAuditEvent({
      eventType: 'TENANT_TEST', entityType: 'CRUISE_LINE', entityId: otherLine.id,
      actorUserId: TENANT_ADMIN_ID, actorDisplayName: 'Tenant Admin Security Test', cruiseLineId: otherLine.id,
      source: AUDIT_SOURCE, createdAt: new Date().toISOString()
    })

    const token = bearer(ownLine.id)
    const ownAudit = await request(app).get(`/cruise/audit-events?source=${AUDIT_SOURCE}`).set('Authorization', token)
    expect(ownAudit.statusCode).toBe(200)
    expect(ownAudit.body.auditEvents).toHaveLength(1)
    expect(ownAudit.body.auditEvents[0].cruiseLineId).toBe(ownLine.id)
    expect(ownAudit.body.filters.cruiseLineId).toBe(ownLine.id)

    const crossTenant = await request(app).get(`/cruise/audit-events?source=${AUDIT_SOURCE}&cruiseLineId=${otherLine.id}`).set('Authorization', token)
    expect(crossTenant.statusCode).toBe(403)
  })
})
