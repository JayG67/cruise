const request = require('supertest')
const { randomUUID } = require('crypto')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

describe('Sailing and itinerary API integration tests', () => {
  it('GET /cruise/ship/:shipId/sailings should return five sailings for a seeded ship', async () => {
    const cruiseRes = await request(app).get('/cruise')

    expect(cruiseRes.statusCode).toBe(200)

    const shipsRes = await request(app)
      .get(`/cruise/ships/${cruiseRes.body[0].id}`)

    expect(shipsRes.statusCode).toBe(200)

    const shipId = shipsRes.body[0].id

    const sailingsRes = await request(app)
      .get(`/cruise/ship/${shipId}/sailings`)

    expect(sailingsRes.statusCode).toBe(200)
    expect(Array.isArray(sailingsRes.body)).toBe(true)
    expect(sailingsRes.body).toHaveLength(5)
    expect(sailingsRes.body.filter(sailing => sailing.isRepositioning)).toHaveLength(1)

    sailingsRes.body.forEach((sailing) => {
      expect(sailing).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          shipId,
          departureDate: expect.stringMatching(/^2026-0[789]-\d{2}$/),
          port: expect.any(String),
          departurePort: expect.any(String),
          arrivalPort: expect.any(String),
          days: expect.any(Number),
          isRepositioning: expect.any(Boolean)
        })
      )
    })
  })


  it('seeded ships should include one longer repositioning sailing with a different arrival port', async () => {
    const cruiseRes = await request(app).get('/cruise')
    const shipsRes = await request(app).get(`/cruise/ships/${cruiseRes.body[0].id}`)
    const sailingsRes = await request(app).get(`/cruise/ship/${shipsRes.body[0].id}/sailings`)

    const repositioningSailing = sailingsRes.body.find(sailing => sailing.isRepositioning)

    expect(repositioningSailing).toEqual(
      expect.objectContaining({
        departurePort: expect.any(String),
        arrivalPort: expect.any(String),
        isRepositioning: true
      })
    )
    expect(repositioningSailing.days).toBeGreaterThanOrEqual(10)
    expect(repositioningSailing.arrivalPort).not.toBe(repositioningSailing.departurePort)
  })

  it('GET /cruise/sailings/:sailingId/itinerary should return itinerary days with activity schedules', async () => {
    const cruiseRes = await request(app).get('/cruise')
    const shipsRes = await request(app).get(`/cruise/ships/${cruiseRes.body[0].id}`)
    const sailingsRes = await request(app).get(`/cruise/ship/${shipsRes.body[0].id}/sailings`)

    const sailing = sailingsRes.body[0]

    const itineraryRes = await request(app)
      .get(`/cruise/sailings/${sailing.id}/itinerary`)

    expect(itineraryRes.statusCode).toBe(200)
    expect(Array.isArray(itineraryRes.body)).toBe(true)
    expect(itineraryRes.body).toHaveLength(sailing.days)

    itineraryRes.body.forEach((itineraryDay, index) => {
      expect(itineraryDay).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          sailingId: sailing.id,
          day: index + 1,
          title: expect.any(String),
          port: expect.any(String),
          activitySchedule: expect.any(Array)
        })
      )

      expect(itineraryDay.activitySchedule.length).toBeGreaterThan(0)

      itineraryDay.activitySchedule.forEach((activity) => {
        expect(activity).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            itineraryDayId: itineraryDay.id,
            time: expect.any(String),
            activity: expect.any(String)
          })
        )
      })
    })
  })

  it('GET /cruise/ship/:shipId/sailings should return 404 when a ship has no sailings', async () => {
    const res = await request(app)
      .get(`/cruise/ship/${randomUUID()}/sailings`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({
      message: 'No sailings found for the specified ship'
    })
  })


  it('seeded ships should include one longer repositioning sailing with a different arrival port', async () => {
    const cruiseRes = await request(app).get('/cruise')
    const shipsRes = await request(app).get(`/cruise/ships/${cruiseRes.body[0].id}`)
    const sailingsRes = await request(app).get(`/cruise/ship/${shipsRes.body[0].id}/sailings`)

    const repositioningSailing = sailingsRes.body.find(sailing => sailing.isRepositioning)

    expect(repositioningSailing).toEqual(
      expect.objectContaining({
        departurePort: expect.any(String),
        arrivalPort: expect.any(String),
        isRepositioning: true
      })
    )
    expect(repositioningSailing.days).toBeGreaterThanOrEqual(10)
    expect(repositioningSailing.arrivalPort).not.toBe(repositioningSailing.departurePort)
  })

  it('GET /cruise/sailings/:sailingId/itinerary should return 404 when a sailing has no itinerary', async () => {
    const res = await request(app)
      .get(`/cruise/sailings/${randomUUID()}/itinerary`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({
      message: 'No itinerary found for the specified sailing'
    })
  })
})
