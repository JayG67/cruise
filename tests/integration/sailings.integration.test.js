const request = require('supertest')
const { randomUUID } = require('crypto')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

async function getSeededShipAndSailing() {
  const cruiseRes = await request(app).get('/cruise')
  const shipsRes = await request(app).get(`/cruise/ships/${cruiseRes.body[0].id}`)
  const sailingsRes = await request(app).get(`/cruise/ship/${shipsRes.body[0].id}/sailings`)

  return {
    cruiseLine: cruiseRes.body[0],
    ship: shipsRes.body[0],
    sailing: sailingsRes.body[0]
  }
}

describe('Sailing and itinerary API integration tests', () => {
  it('GET /cruise/ship/:shipId/sailings should return five sailings for a seeded ship', async () => {
    const { ship } = await getSeededShipAndSailing()

    const sailingsRes = await request(app)
      .get(`/cruise/ship/${ship.id}/sailings`)

    expect(sailingsRes.statusCode).toBe(200)
    expect(Array.isArray(sailingsRes.body)).toBe(true)
    expect(sailingsRes.body).toHaveLength(5)
    expect(sailingsRes.body.filter(sailing => sailing.isRepositioning)).toHaveLength(1)

    sailingsRes.body.forEach((sailing) => {
      expect(sailing).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          shipId: ship.id,
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
    const { ship } = await getSeededShipAndSailing()
    const sailingsRes = await request(app).get(`/cruise/ship/${ship.id}/sailings`)

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
    const { sailing } = await getSeededShipAndSailing()

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
    })
  })

  it('POST, PATCH, and DELETE /cruise/ship/:shipId/sailings should manage a sailing', async () => {
    const { ship } = await getSeededShipAndSailing()

    const createRes = await request(app)
      .post(`/cruise/ship/${ship.id}/sailings`)
      .send({
        departureDate: '2026-10-01',
        port: 'Miami, Florida',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Nassau, Bahamas',
        days: 4,
        isRepositioning: false
      })

    expect(createRes.statusCode).toBe(201)
    expect(createRes.body).toEqual({
      message: 'Sailing created successfully',
      id: expect.any(String)
    })

    const updateRes = await request(app)
      .patch(`/cruise/sailings/${createRes.body.id}`)
      .send({
        departureDate: '2026-10-02',
        port: 'Fort Lauderdale, Florida',
        departurePort: 'Fort Lauderdale, Florida',
        arrivalPort: 'Barcelona, Spain',
        days: 12,
        isRepositioning: true
      })

    expect(updateRes.statusCode).toBe(200)
    expect(updateRes.body).toEqual({ message: 'Sailing updated successfully' })

    const sailingsRes = await request(app).get(`/cruise/ship/${ship.id}/sailings`)
    const updatedSailing = sailingsRes.body.find(sailing => sailing.id === createRes.body.id)

    expect(updatedSailing).toEqual(
      expect.objectContaining({
        departureDate: '2026-10-02',
        departurePort: 'Fort Lauderdale, Florida',
        arrivalPort: 'Barcelona, Spain',
        days: 12,
        isRepositioning: true
      })
    )

    const deleteRes = await request(app)
      .delete(`/cruise/sailings/${createRes.body.id}`)

    expect(deleteRes.statusCode).toBe(200)
    expect(deleteRes.body).toEqual({ message: 'Sailing deleted successfully' })
  })

  it('POST, PATCH, and DELETE itinerary days should manage itinerary day records', async () => {
    const { sailing } = await getSeededShipAndSailing()

    const createRes = await request(app)
      .post(`/cruise/sailings/${sailing.id}/itinerary`)
      .send({
        day: 20,
        title: 'Portfolio Test Port Day',
        port: 'Nassau, Bahamas',
        activitySchedule: [
          {
            time: '9:00 AM',
            activity: 'Portfolio shore excursion'
          }
        ]
      })

    expect(createRes.statusCode).toBe(201)
    expect(createRes.body).toEqual({
      message: 'Itinerary day created successfully',
      id: expect.any(String)
    })

    const updateRes = await request(app)
      .patch(`/cruise/itinerary-days/${createRes.body.id}`)
      .send({
        day: 21,
        title: 'Updated Portfolio Port Day',
        port: 'Cozumel, Mexico',
        activitySchedule: []
      })

    expect(updateRes.statusCode).toBe(200)
    expect(updateRes.body).toEqual({ message: 'Itinerary day updated successfully' })

    const itineraryRes = await request(app).get(`/cruise/sailings/${sailing.id}/itinerary`)
    const updatedDay = itineraryRes.body.find(day => day.id === createRes.body.id)

    expect(updatedDay).toEqual(
      expect.objectContaining({
        day: 21,
        title: 'Updated Portfolio Port Day',
        port: 'Cozumel, Mexico'
      })
    )

    const deleteRes = await request(app)
      .delete(`/cruise/itinerary-days/${createRes.body.id}`)

    expect(deleteRes.statusCode).toBe(200)
    expect(deleteRes.body).toEqual({ message: 'Itinerary day deleted successfully' })
  })

  it('POST, PATCH, and DELETE activities should manage activity schedule records', async () => {
    const { sailing } = await getSeededShipAndSailing()
    const itineraryRes = await request(app).get(`/cruise/sailings/${sailing.id}/itinerary`)
    const itineraryDay = itineraryRes.body[0]

    const createRes = await request(app)
      .post(`/cruise/itinerary-days/${itineraryDay.id}/activities`)
      .send({
        time: '2:00 PM',
        activity: 'Portfolio poolside QA meetup'
      })

    expect(createRes.statusCode).toBe(201)
    expect(createRes.body).toEqual({
      message: 'Activity created successfully',
      id: expect.any(String)
    })

    const updateRes = await request(app)
      .patch(`/cruise/activities/${createRes.body.id}`)
      .send({
        time: '3:00 PM',
        activity: 'Updated portfolio poolside QA meetup'
      })

    expect(updateRes.statusCode).toBe(200)
    expect(updateRes.body).toEqual({ message: 'Activity updated successfully' })

    const updatedItineraryRes = await request(app).get(`/cruise/sailings/${sailing.id}/itinerary`)
    const updatedActivity = updatedItineraryRes.body
      .flatMap(day => day.activitySchedule)
      .find(activity => activity.id === createRes.body.id)

    expect(updatedActivity).toEqual(
      expect.objectContaining({
        time: '3:00 PM',
        activity: 'Updated portfolio poolside QA meetup'
      })
    )

    const deleteRes = await request(app)
      .delete(`/cruise/activities/${createRes.body.id}`)

    expect(deleteRes.statusCode).toBe(200)
    expect(deleteRes.body).toEqual({ message: 'Activity deleted successfully' })
  })

  it('should return validation errors for invalid sailing payloads', async () => {
    const { ship } = await getSeededShipAndSailing()

    const res = await request(app)
      .post(`/cruise/ship/${ship.id}/sailings`)
      .send({
        departureDate: '10/01/2026',
        departurePort: '',
        arrivalPort: '',
        days: 0,
        isRepositioning: false
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Validation failed')
  })

  it('GET /cruise/ship/:shipId/sailings should return 404 when a ship has no sailings', async () => {
    const res = await request(app)
      .get(`/cruise/ship/${randomUUID()}/sailings`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({
      message: 'No sailings found for the specified ship'
    })
  })

  it('GET /cruise/sailings/:sailingId/itinerary should return 404 when a sailing has no itinerary', async () => {
    const res = await request(app)
      .get(`/cruise/sailings/${randomUUID()}/itinerary`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({
      message: 'No itinerary found for the specified sailing'
    })
  })

  it('should return 404 when updating or deleting missing sailing, itinerary, or activity records', async () => {
    const sailingRes = await request(app)
      .delete(`/cruise/sailings/${randomUUID()}`)

    const itineraryRes = await request(app)
      .delete(`/cruise/itinerary-days/${randomUUID()}`)

    const activityRes = await request(app)
      .delete(`/cruise/activities/${randomUUID()}`)

    expect(sailingRes.statusCode).toBe(404)
    expect(itineraryRes.statusCode).toBe(404)
    expect(activityRes.statusCode).toBe(404)
  })
})
