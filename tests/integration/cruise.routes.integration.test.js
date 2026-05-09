const request = require('supertest')
const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')
const db = require('../../db')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

afterAll(async () => {
  await db.pool.end()
})

describe('Cruise API integration tests', () => {
  it('GET /health should return app status', async () => {
    const res = await request(app).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('GET /cruise should return cruise lines', async () => {
    const res = await request(app).get('/cruise')

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0]).toHaveProperty('name')
  })

  it('GET /cruise/ships/:cruiseLineId should return ships for a cruise line', async () => {
    const cruiseRes = await request(app).get('/cruise')
    const cruiseLineId = cruiseRes.body[0].id

    const shipRes = await request(app).get(`/cruise/ships/${cruiseLineId}`)

    expect(shipRes.statusCode).toBe(200)
    expect(Array.isArray(shipRes.body)).toBe(true)
    expect(shipRes.body.length).toBeGreaterThan(0)
    expect(shipRes.body[0]).toHaveProperty('id')
    expect(shipRes.body[0]).toHaveProperty('name')
    expect(shipRes.body[0]).toHaveProperty('cruiseLineId')
  })
})