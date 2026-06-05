const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

describe('Turnaround operations API integration tests', () => {
  it('GET /cruise/turnaround-operations returns database-backed plans with sailing context and role tasks', async () => {
    const res = await request(app).get('/cruise/turnaround-operations')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(2)

    const firstOperation = res.body[0]
    expect(firstOperation).toEqual(expect.objectContaining({
      title: expect.any(String),
      turnaroundDate: expect.any(String),
      port: expect.any(String),
      status: expect.any(String),
      readinessLevel: expect.any(String),
      passengerCount: expect.any(Number)
    }))
    expect(firstOperation.sailing).toEqual(expect.objectContaining({ id: firstOperation.sailingId }))
    expect(firstOperation.ship).toEqual(expect.objectContaining({ id: firstOperation.sailing.shipId }))
    expect(firstOperation.cruiseLine).toEqual(expect.objectContaining({ id: firstOperation.ship.cruiseLineId }))
    expect(firstOperation.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ departmentRole: 'turnaround-manager', taskName: expect.any(String) })
      ])
    )
  })
})
