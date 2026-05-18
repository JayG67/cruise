const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

describe('Admin reset demo data integration tests', () => {
  jest.setTimeout(30000)
  it('POST /admin/reset-demo-data should reset data from the seed file', async () => {
    const temporaryCruiseLineName = `Temporary Reset Test Line ${Date.now()}`

    const createRes = await request(app)
      .post('/cruise/cruise-line')
      .send({
        name: temporaryCruiseLineName,
        country: 'United States',
        website: 'https://example.com'
      })

    expect(createRes.statusCode).toBe(201)

    const resetRes = await request(app).post('/admin/reset-demo-data')

    expect(resetRes.statusCode).toBe(200)
    expect(resetRes.body.message).toBe('Demo data reset successfully')
    expect(resetRes.body.cruiseLineCount).toBeGreaterThan(0)
    expect(resetRes.body.shipCount).toBeGreaterThan(0)

    const cruiseRes = await request(app).get('/cruise')

    expect(cruiseRes.statusCode).toBe(200)
    expect(Array.isArray(cruiseRes.body)).toBe(true)
    expect(cruiseRes.body.some(line => line.name === temporaryCruiseLineName)).toBe(false)
  })

  it('POST /admin/reset-demo-data should return JSON response metadata', async () => {
    const res = await request(app).post('/admin/reset-demo-data')

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.body).toHaveProperty('message')
    expect(res.body).toHaveProperty('cruiseLineCount')
    expect(res.body).toHaveProperty('shipCount')
    expect(res.body).toHaveProperty('source', 'data/cruise.json')
    expect(typeof res.body.cruiseLineCount).toBe('number')
    expect(typeof res.body.shipCount).toBe('number')
  })
})
