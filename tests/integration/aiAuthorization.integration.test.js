const crypto = require('crypto')
const request = require('supertest')
const { eq, ne } = require('drizzle-orm')

const app = require('../../app')
const db = require('../../db')
const demoUserTable = require('../../models/demoUser.model')
const sailingTable = require('../../models/sailing.model')
const turnaroundOperationTable = require('../../models/turnaroundOperation.model')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const ORIGINAL_AUTH_MODE = process.env.CRUISE_AUTH_MODE
const ORIGINAL_JWT_SECRET = process.env.CRUISE_JWT_SECRET
const JWT_SECRET = 'ai-authorization-security-secret-32-byte-minimum'

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url')
  return `${signingInput}.${signature}`
}

function bearer(userId, role) {
  const now = Math.floor(Date.now() / 1000)
  return `Bearer ${signToken({ sub: userId, role, name: `${role} AI authorization test`, exp: now + 300 })}`
}

async function findManager() {
  const managers = await db.select().from(demoUserTable).where(eq(demoUserTable.role, 'TURNAROUND_MANAGER'))
  const manager = managers.find(row => row.assignedShipId)
  if (!manager) throw new Error('Expected an assigned turnaround manager')
  return manager
}

async function findOperationForShip(shipId) {
  const sailings = await db.select().from(sailingTable).where(eq(sailingTable.shipId, shipId))
  for (const sailing of sailings) {
    const operation = (await db.select().from(turnaroundOperationTable).where(eq(turnaroundOperationTable.sailingId, sailing.id)).limit(1))[0]
    if (operation) return operation
  }
  throw new Error(`Expected turnaround operation for ship ${shipId}`)
}

async function findOperationOutsideShip(shipId) {
  const sailings = await db.select().from(sailingTable).where(ne(sailingTable.shipId, shipId))
  for (const sailing of sailings) {
    const operation = (await db.select().from(turnaroundOperationTable).where(eq(turnaroundOperationTable.sailingId, sailing.id)).limit(1))[0]
    if (operation) return operation
  }
  throw new Error(`Expected turnaround operation outside ship ${shipId}`)
}

beforeAll(async () => {
  process.env.CRUISE_AUTH_MODE = 'jwt'
  process.env.CRUISE_JWT_SECRET = JWT_SECRET
  await initializeDatabase()
  await loadCruiseData()
})

afterAll(() => {
  if (ORIGINAL_AUTH_MODE === undefined) delete process.env.CRUISE_AUTH_MODE
  else process.env.CRUISE_AUTH_MODE = ORIGINAL_AUTH_MODE
  if (ORIGINAL_JWT_SECRET === undefined) delete process.env.CRUISE_JWT_SECRET
  else process.env.CRUISE_JWT_SECRET = ORIGINAL_JWT_SECRET
})

describe('production AI authorization', () => {
  it('exposes platform AI runtime status only to a server-confirmed global administrator', async () => {
    const passenger = await request(app).get('/ai/program-status').set('Authorization', bearer('UPASS00001', 'PASSENGER'))
    const globalAdmin = await request(app).get('/ai/program-status').set('Authorization', bearer('UADMIN0001', 'ADMIN'))

    expect(passenger.statusCode).toBe(403)
    expect(globalAdmin.statusCode).toBe(200)
    expect(globalAdmin.body.runtime).toBeTruthy()
  })

  it('does not let an operational role invoke the unscoped AI briefing endpoint', async () => {
    const manager = await findManager()
    const response = await request(app)
      .post('/ai/turnaround-briefing')
      .set('Authorization', bearer(manager.id, manager.role))
      .send({})

    expect(response.statusCode).toBe(403)
  })

  it('lets a global administrator reach schema validation on the unscoped AI endpoint', async () => {
    const response = await request(app)
      .post('/ai/turnaround-briefing')
      .set('Authorization', bearer('UADMIN0001', 'ADMIN'))
      .send({ unexpectedField: true })

    expect(response.statusCode).toBe(400)
  })

  it('allows operational AI history only for the authenticated assignment scope', async () => {
    const manager = await findManager()
    const ownOperation = await findOperationForShip(manager.assignedShipId)
    const otherOperation = await findOperationOutsideShip(manager.assignedShipId)
    const token = bearer(manager.id, manager.role)

    const own = await request(app).get(`/ai/turnaround-operations/${ownOperation.id}/briefings?limit=5`).set('Authorization', token)
    const other = await request(app).get(`/ai/turnaround-operations/${otherOperation.id}/briefings?limit=5`).set('Authorization', token)

    expect(own.statusCode).toBe(200)
    expect(other.statusCode).toBe(403)
  })

  it('rejects a forged operational role when the server-side active assignment does not match', async () => {
    const manager = await findManager()
    const operation = await findOperationForShip(manager.assignedShipId)
    const response = await request(app)
      .get(`/ai/turnaround-operations/${operation.id}/briefings?limit=5`)
      .set('Authorization', bearer('UPASS00001', 'TURNAROUND_MANAGER'))

    expect(response.statusCode).toBe(403)
  })
})
