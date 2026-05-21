const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

describe('Admin reset demo data integration tests', () => {
  jest.setTimeout(120000)

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
    expect(resetRes.body.demoUserCount).toBeGreaterThan(0)

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
    expect(res.body).toHaveProperty('customerCount')
    expect(res.body).toHaveProperty('bookingCount')
    expect(res.body).toHaveProperty('bookingPassengerCount')
    expect(res.body).toHaveProperty('demoUserCount')
    expect(res.body).toHaveProperty('source', 'data/cruise.json')
    expect(typeof res.body.cruiseLineCount).toBe('number')
    expect(typeof res.body.shipCount).toBe('number')
    expect(typeof res.body.demoUserCount).toBe('number')
  })

  it('POST /admin/reset-demo-data should be idempotent when demo users already exist', async () => {
    const firstResetRes = await request(app).post('/admin/reset-demo-data')

    expect(firstResetRes.statusCode).toBe(200)
    expect(firstResetRes.body.message).toBe('Demo data reset successfully')
    expect(firstResetRes.body.demoUserCount).toBeGreaterThan(0)

    const secondResetRes = await request(app).post('/admin/reset-demo-data')

    expect(secondResetRes.statusCode).toBe(200)
    expect(secondResetRes.body.message).toBe('Demo data reset successfully')
    expect(secondResetRes.body.demoUserCount).toBe(firstResetRes.body.demoUserCount)

    const demoUsersRes = await request(app).get('/cruise/demo-users')

    expect(demoUsersRes.statusCode).toBe(200)
    expect(demoUsersRes.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'UADMIN0001',
          role: 'ADMIN'
        })
      ])
    )
  })

  it('POST /admin/reset-demo-data should preserve seeded role context after repeated resets', async () => {
    await request(app).post('/admin/reset-demo-data')
    await request(app).post('/admin/reset-demo-data')

    const adminContextRes = await request(app).get('/cruise/demo-users/UADMIN0001/context')
    const passengerContextRes = await request(app).get('/cruise/demo-users/UPASS00001/context')

    expect(adminContextRes.statusCode).toBe(200)
    expect(adminContextRes.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: 'UADMIN0001',
          role: 'ADMIN'
        }),
        visibility: expect.objectContaining({
          canManageCruiseData: true,
          canViewAllBookings: true,
          canViewAllCustomers: true
        }),
        bookings: []
      })
    )

    expect(passengerContextRes.statusCode).toBe(200)
    expect(passengerContextRes.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: 'UPASS00001',
          role: 'PASSENGER'
        }),
        customer: expect.objectContaining({
          id: expect.any(String)
        }),
        visibility: expect.objectContaining({
          canManageCruiseData: false,
          canViewAllBookings: false,
          canViewAllCustomers: false
        })
      })
    )
    expect(passengerContextRes.body.bookings.length).toBeGreaterThan(0)
  })
})
