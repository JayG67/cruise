const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

describe('Health API integration tests', () => {
  it('GET /health should return app status', async () => {
    const res = await request(app).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('GET /health should return JSON', async () => {
    const res = await request(app).get('/health')

    expect(res.headers['content-type']).toContain('application/json')
    expect(res.body).toHaveProperty('status')
    expect(typeof res.body.status).toBe('string')
  })
})