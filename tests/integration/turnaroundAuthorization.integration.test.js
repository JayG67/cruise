const crypto = require('crypto')
const request = require('supertest')
const { eq, ne } = require('drizzle-orm')

const app = require('../../app')
const db = require('../../db')
const demoUserTable = require('../../models/demoUser.model')
const sailingTable = require('../../models/sailing.model')
const turnaroundOperationTable = require('../../models/turnaroundOperation.model')
const turnaroundTaskTable = require('../../models/turnaroundTask.model')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')
const { normalizeOperationalRole } = require('../../services/turnaroundAccess.service')

const ORIGINAL_AUTH_MODE = process.env.CRUISE_AUTH_MODE
const ORIGINAL_JWT_SECRET = process.env.CRUISE_JWT_SECRET
const JWT_SECRET = 'turnaround-authorization-security-secret-32-byte-minimum'

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
  return `Bearer ${signToken({ sub: userId, role, name: `${role} security test`, exp: now + 300 })}`
}

async function findOperationalUser(role) {
  const rows = await db.select().from(demoUserTable).where(eq(demoUserTable.role, role))
  const user = rows.find(row => row.assignedShipId)
  if (!user) throw new Error(`Expected assigned ${role} demo user`)
  return user
}

async function findOperationForShip(shipId) {
  const sailings = await db.select().from(sailingTable).where(eq(sailingTable.shipId, shipId))
  for (const sailing of sailings) {
    const operations = await db.select().from(turnaroundOperationTable).where(eq(turnaroundOperationTable.sailingId, sailing.id)).limit(1)
    if (operations[0]) return operations[0]
  }
  throw new Error(`Expected turnaround operation for ship ${shipId}`)
}

async function findOperationOutsideShip(shipId) {
  const sailings = await db.select().from(sailingTable).where(ne(sailingTable.shipId, shipId))
  for (const sailing of sailings) {
    const operations = await db.select().from(turnaroundOperationTable).where(eq(turnaroundOperationTable.sailingId, sailing.id)).limit(1)
    if (operations[0]) return operations[0]
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

describe('production turnaround operational authorization', () => {


  it('requires authenticated operational scope for turnaround reads and admin setup', async () => {
    const anonymousOperations = await request(app).get('/cruise/turnaround-operations')
    const passengerOperations = await request(app).get('/cruise/turnaround-operations').set('Authorization', bearer('UPASS00001', 'PASSENGER'))
    const passengerAdminSetup = await request(app).get('/cruise/turnaround-admin/setup').set('Authorization', bearer('UPASS00001', 'PASSENGER'))

    expect(anonymousOperations.statusCode).toBe(403)
    expect(passengerOperations.statusCode).toBe(403)
    expect(passengerAdminSetup.statusCode).toBe(403)
  })

  it('scopes turnaround list reads to the operational user assigned ship', async () => {
    const manager = await findOperationalUser('TURNAROUND_MANAGER')
    const token = bearer(manager.id, manager.role)
    const response = await request(app).get('/cruise/turnaround-operations').set('Authorization', token)

    expect(response.statusCode).toBe(200)
    expect(response.body.length).toBeGreaterThan(0)
    const sailingIds = new Set((await db.select().from(sailingTable).where(eq(sailingTable.shipId, manager.assignedShipId))).map(row => row.id))
    expect(response.body.every(operation => sailingIds.has(operation.sailingId))).toBe(true)
  })
  it('blocks passengers from turnaround command mutations before validation', async () => {
    const manager = await findOperationalUser('TURNAROUND_MANAGER')
    const operation = await findOperationForShip(manager.assignedShipId)
    const response = await request(app)
      .patch(`/cruise/turnaround-operations/${operation.id}`)
      .set('Authorization', bearer('UPASS00001', 'PASSENGER'))
      .send({})
    expect(response.statusCode).toBe(403)
  })

  it('allows the assigned turnaround manager to reach validation but blocks a different ship', async () => {
    const manager = await findOperationalUser('TURNAROUND_MANAGER')
    const ownOperation = await findOperationForShip(manager.assignedShipId)
    const otherOperation = await findOperationOutsideShip(manager.assignedShipId)
    const token = bearer(manager.id, manager.role)

    const own = await request(app).patch(`/cruise/turnaround-operations/${ownOperation.id}`).set('Authorization', token).send({})
    const other = await request(app).patch(`/cruise/turnaround-operations/${otherOperation.id}`).set('Authorization', token).send({})

    expect(own.statusCode).toBe(400)
    expect(other.statusCode).toBe(403)
  })

  it('limits a department lead to the same department on the assigned ship', async () => {
    const lead = await findOperationalUser('HOUSEKEEPING_LEAD')
    const operation = await findOperationForShip(lead.assignedShipId)
    const token = bearer(lead.id, lead.role)

    const ownDepartment = await request(app)
      .patch(`/cruise/turnaround-operations/${operation.id}/staffing/HOUSEKEEPING_LEAD`)
      .set('Authorization', token)
      .send({ unexpectedField: true })
    const otherDepartment = await request(app)
      .patch(`/cruise/turnaround-operations/${operation.id}/staffing/ENGINEERING_LEAD`)
      .set('Authorization', token)
      .send({ unexpectedField: true })

    expect(ownDepartment.statusCode).toBe(400)
    expect(otherDepartment.statusCode).toBe(403)
  })

  it('prevents a department lead from mutating another department task', async () => {
    const lead = await findOperationalUser('HOUSEKEEPING_LEAD')
    const operation = await findOperationForShip(lead.assignedShipId)
    const tasks = await db.select().from(turnaroundTaskTable).where(eq(turnaroundTaskTable.operationId, operation.id))
    const leadDepartment = normalizeOperationalRole(lead.role)
    const ownTask = tasks.find(task => normalizeOperationalRole(task.departmentRole) === leadDepartment)
    const otherTask = tasks.find(task => normalizeOperationalRole(task.departmentRole) !== leadDepartment)
    expect(ownTask).toBeTruthy()
    expect(otherTask).toBeTruthy()
    const token = bearer(lead.id, lead.role)

    const own = await request(app).patch(`/cruise/turnaround-tasks/${ownTask.id}/details`).set('Authorization', token).send({ unexpectedField: true })
    const other = await request(app).patch(`/cruise/turnaround-tasks/${otherTask.id}/details`).set('Authorization', token).send({ unexpectedField: true })

    expect(own.statusCode).toBe(400)
    expect(other.statusCode).toBe(403)
  })

  it('keeps administrator override for operational mutations', async () => {
    const manager = await findOperationalUser('TURNAROUND_MANAGER')
    const operation = await findOperationForShip(manager.assignedShipId)
    const response = await request(app)
      .patch(`/cruise/turnaround-operations/${operation.id}/staffing/ENGINEERING_LEAD`)
      .set('Authorization', bearer('UADMIN0001', 'ADMIN'))
      .send({ unexpectedField: true })
    expect(response.statusCode).toBe(400)
  })
})
