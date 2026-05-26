const request = require('supertest')
const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

jest.setTimeout(30000)

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

async function getSeededShipAndSailing() {
  const cruiseRes = await request(app).get('/cruise')
  expect(cruiseRes.statusCode).toBe(200)
  expect(Array.isArray(cruiseRes.body)).toBe(true)

  for (const cruiseLine of cruiseRes.body) {
    const shipsRes = await request(app).get(`/cruise/ships/${cruiseLine.id}`)

    if (shipsRes.statusCode !== 200 || !Array.isArray(shipsRes.body) || shipsRes.body.length === 0) {
      continue
    }

    for (const ship of shipsRes.body) {
      const sailingsRes = await request(app).get(`/cruise/ship/${ship.id}/sailings`)

      if (sailingsRes.statusCode === 200 && Array.isArray(sailingsRes.body) && sailingsRes.body.length > 0) {
        return {
          ship,
          sailing: sailingsRes.body[0]
        }
      }
    }
  }

  throw new Error('Expected seeded cruise data to include at least one ship with a sailing')
}

describe('Sailing and itinerary API integration tests', () => {
  it('returns sailings and itinerary for a seeded ship', async () => {
    const { ship, sailing } = await getSeededShipAndSailing()

    expect(ship.currentPort).toEqual(expect.any(String))

    const sailingsRes = await request(app).get(`/cruise/ship/${ship.id}/sailings`)
    expect(sailingsRes.statusCode).toBe(200)
    expect(Array.isArray(sailingsRes.body)).toBe(true)
    expect(sailingsRes.body.length).toBeGreaterThan(0)

    const itineraryRes = await request(app).get(`/cruise/sailings/${sailing.id}/itinerary`)
    expect(itineraryRes.statusCode).toBe(200)
    expect(Array.isArray(itineraryRes.body)).toBe(true)
    expect(itineraryRes.body[0]).toEqual(
      expect.objectContaining({
        activitySchedule: expect.any(Array)
      })
    )
  })

  it('creates, updates, and deletes sailing records', async () => {
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

    const deleteRes = await request(app).delete(`/cruise/sailings/${createRes.body.id}`)
    expect(deleteRes.statusCode).toBe(200)
  })

  it('creates, updates, and deletes itinerary days and activities', async () => {
    const { sailing } = await getSeededShipAndSailing()

    const createDayRes = await request(app)
      .post(`/cruise/sailings/${sailing.id}/itinerary`)
      .send({
        day: 20,
        title: 'Portfolio Test Port Day',
        port: 'Nassau, Bahamas',
        activitySchedule: [{ time: '9:00 AM', activity: 'Portfolio shore excursion' }]
      })

    expect(createDayRes.statusCode).toBe(201)

    const updateDayRes = await request(app)
      .patch(`/cruise/itinerary-days/${createDayRes.body.id}`)
      .send({
        day: 21,
        title: 'Updated Portfolio Port Day',
        port: 'Cozumel, Mexico',
        activitySchedule: []
      })

    expect(updateDayRes.statusCode).toBe(200)

    const createActivityRes = await request(app)
      .post(`/cruise/itinerary-days/${createDayRes.body.id}/activities`)
      .send({
        time: '2:00 PM',
        activity: 'Portfolio poolside QA meetup'
      })

    expect(createActivityRes.statusCode).toBe(201)

    const updateActivityRes = await request(app)
      .patch(`/cruise/activities/${createActivityRes.body.id}`)
      .send({
        time: '3:00 PM',
        activity: 'Updated portfolio poolside QA meetup'
      })

    expect(updateActivityRes.statusCode).toBe(200)

    const deleteActivityRes = await request(app).delete(`/cruise/activities/${createActivityRes.body.id}`)
    expect(deleteActivityRes.statusCode).toBe(200)

    const deleteDayRes = await request(app).delete(`/cruise/itinerary-days/${createDayRes.body.id}`)
    expect(deleteDayRes.statusCode).toBe(200)
  })

  it('persists created sailing values and removes the sailing after delete', async () => {
    const { ship } = await getSeededShipAndSailing()

    const createRes = await request(app)
      .post(`/cruise/ship/${ship.id}/sailings`)
      .send({
        departureDate: '2026-11-11',
        port: 'Miami, Florida',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Barcelona, Spain',
        days: 13,
        isRepositioning: true
      })

    expect(createRes.statusCode).toBe(201)

    const sailingsAfterCreate = await request(app).get(`/cruise/ship/${ship.id}/sailings`)
    expect(sailingsAfterCreate.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createRes.body.id,
          departureDate: '2026-11-11',
          departurePort: 'Miami, Florida',
          arrivalPort: 'Barcelona, Spain',
          days: 13,
          isRepositioning: true
        })
      ])
    )

    const deleteRes = await request(app).delete(`/cruise/sailings/${createRes.body.id}`)
    expect(deleteRes.statusCode).toBe(200)

    const sailingsAfterDelete = await request(app).get(`/cruise/ship/${ship.id}/sailings`)
    expect(sailingsAfterDelete.body.find(sailing => sailing.id === createRes.body.id)).toBeUndefined()
  })

  it('persists itinerary day and activity updates in the itinerary response', async () => {
    const { sailing } = await getSeededShipAndSailing()

    const createDayRes = await request(app)
      .post(`/cruise/sailings/${sailing.id}/itinerary`)
      .send({
        day: 22,
        title: 'Persistence Test Day',
        port: 'Nassau, Bahamas',
        activitySchedule: [{ time: '8:00 AM', activity: 'Original activity' }]
      })

    expect(createDayRes.statusCode).toBe(201)

    const createActivityRes = await request(app)
      .post(`/cruise/itinerary-days/${createDayRes.body.id}/activities`)
      .send({
        time: '10:00 AM',
        activity: 'Secondary activity'
      })

    expect(createActivityRes.statusCode).toBe(201)

    const updateDayRes = await request(app)
      .patch(`/cruise/itinerary-days/${createDayRes.body.id}`)
      .send({
        day: 23,
        title: 'Updated Persistence Test Day',
        port: 'Cozumel, Mexico',
        activitySchedule: []
      })

    expect(updateDayRes.statusCode).toBe(200)

    const updateActivityRes = await request(app)
      .patch(`/cruise/activities/${createActivityRes.body.id}`)
      .send({
        time: '11:00 AM',
        activity: 'Updated secondary activity'
      })

    expect(updateActivityRes.statusCode).toBe(200)

    const itineraryRes = await request(app).get(`/cruise/sailings/${sailing.id}/itinerary`)
    const updatedDay = itineraryRes.body.find(day => day.id === createDayRes.body.id)
    const updatedActivity = itineraryRes.body
      .flatMap(day => day.activitySchedule)
      .find(activity => activity.id === createActivityRes.body.id)

    expect(updatedDay).toEqual(
      expect.objectContaining({
        day: 23,
        title: 'Updated Persistence Test Day',
        port: 'Cozumel, Mexico'
      })
    )
    expect(updatedActivity).toEqual(
      expect.objectContaining({
        time: '11:00 AM',
        activity: 'Updated secondary activity'
      })
    )
  })

  it('rejects invalid sailing, itinerary day, and activity payloads with normalized validation errors', async () => {
    const { ship, sailing } = await getSeededShipAndSailing()
    const itineraryRes = await request(app).get(`/cruise/sailings/${sailing.id}/itinerary`)
    const itineraryDay = itineraryRes.body[0]

    const invalidSailingRes = await request(app)
      .post(`/cruise/ship/${ship.id}/sailings`)
      .send({
        departureDate: '11/11/2026',
        departurePort: '',
        arrivalPort: '',
        days: 0,
        isRepositioning: 'no'
      })

    const invalidItineraryRes = await request(app)
      .post(`/cruise/sailings/${sailing.id}/itinerary`)
      .send({
        day: 0,
        title: '',
        port: '',
        activitySchedule: []
      })

    const invalidActivityRes = await request(app)
      .post(`/cruise/itinerary-days/${itineraryDay.id}/activities`)
      .send({
        time: '',
        activity: ''
      })

    expect(invalidSailingRes.statusCode).toBe(400)
    expect(invalidSailingRes.body.message).toBe('Validation failed')
    expect(invalidSailingRes.body.errors.length).toBeGreaterThan(0)

    expect(invalidItineraryRes.statusCode).toBe(400)
    expect(invalidItineraryRes.body.message).toBe('Validation failed')
    expect(invalidItineraryRes.body.errors.length).toBeGreaterThan(0)

    expect(invalidActivityRes.statusCode).toBe(400)
    expect(invalidActivityRes.body.message).toBe('Validation failed')
    expect(invalidActivityRes.body.errors.length).toBeGreaterThan(0)
  })

  it('returns 404s for missing sailing, itinerary day, and activity records', async () => {
    const missingId = '99999999-9999-4999-8999-999999999999'

    const missingSailingsRes = await request(app).get(`/cruise/ship/${missingId}/sailings`)
    const missingItineraryRes = await request(app).get(`/cruise/sailings/${missingId}/itinerary`)
    const updateSailingRes = await request(app)
      .patch(`/cruise/sailings/${missingId}`)
      .send({
        departureDate: '2026-11-11',
        port: 'Miami, Florida',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Nassau, Bahamas',
        days: 4,
        isRepositioning: false
      })
    const deleteSailingRes = await request(app).delete(`/cruise/sailings/${missingId}`)
    const updateDayRes = await request(app)
      .patch(`/cruise/itinerary-days/${missingId}`)
      .send({
        day: 1,
        title: 'Missing Day',
        port: 'At Sea',
        activitySchedule: []
      })
    const deleteDayRes = await request(app).delete(`/cruise/itinerary-days/${missingId}`)
    const updateActivityRes = await request(app)
      .patch(`/cruise/activities/${missingId}`)
      .send({
        time: '1:00 PM',
        activity: 'Missing activity'
      })
    const deleteActivityRes = await request(app).delete(`/cruise/activities/${missingId}`)

    expect(missingSailingsRes.statusCode).toBe(404)
    expect(missingItineraryRes.statusCode).toBe(404)
    expect(updateSailingRes.statusCode).toBe(404)
    expect(deleteSailingRes.statusCode).toBe(404)
    expect(updateDayRes.statusCode).toBe(404)
    expect(deleteDayRes.statusCode).toBe(404)
    expect(updateActivityRes.statusCode).toBe(404)
    expect(deleteActivityRes.statusCode).toBe(404)
  })

  it('protects parent-child relationships when creating nested resources', async () => {
    const missingId = '88888888-8888-4888-8888-888888888888'

    const sailingForMissingShip = await request(app)
      .post(`/cruise/ship/${missingId}/sailings`)
      .send({
        departureDate: '2026-11-11',
        port: 'Miami, Florida',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Nassau, Bahamas',
        days: 4,
        isRepositioning: false
      })

    const itineraryForMissingSailing = await request(app)
      .post(`/cruise/sailings/${missingId}/itinerary`)
      .send({
        day: 1,
        title: 'Missing sailing itinerary',
        port: 'At Sea',
        activitySchedule: []
      })

    const activityForMissingItineraryDay = await request(app)
      .post(`/cruise/itinerary-days/${missingId}/activities`)
      .send({
        time: '1:00 PM',
        activity: 'Missing itinerary activity'
      })

    expect(sailingForMissingShip.statusCode).toBe(404)
    expect(sailingForMissingShip.body.message).toBe('Ship not found')
    expect(itineraryForMissingSailing.statusCode).toBe(404)
    expect(itineraryForMissingSailing.body.message).toBe('Sailing not found')
    expect(activityForMissingItineraryDay.statusCode).toBe(404)
    expect(activityForMissingItineraryDay.body.message).toBe('Itinerary day not found')
  })

})


describe('Relational cascade and full hierarchy integrity', () => {
  async function createFullCruiseHierarchy() {
    const cruiseLineRes = await request(app)
      .post('/cruise/cruise-line')
      .send({
        name: `Cascade QA Cruise ${Date.now()}-${Math.random()}`,
        country: 'United States',
        website: 'https://example.com'
      })

    expect(cruiseLineRes.statusCode).toBe(201)

    const shipRes = await request(app)
      .post('/cruise/ship')
      .send({
        name: `Cascade QA Ship ${Date.now()}-${Math.random()}`,
        currentPort: 'Miami, Florida',
        cruiseLineId: cruiseLineRes.body.id
      })

    expect(shipRes.statusCode).toBe(201)

    const sailingRes = await request(app)
      .post(`/cruise/ship/${shipRes.body.id}/sailings`)
      .send({
        departureDate: '2026-12-01',
        port: 'Miami, Florida',
        departurePort: 'Miami, Florida',
        arrivalPort: 'Nassau, Bahamas',
        days: 4,
        isRepositioning: false
      })

    expect(sailingRes.statusCode).toBe(201)

    const itineraryDayRes = await request(app)
      .post(`/cruise/sailings/${sailingRes.body.id}/itinerary`)
      .send({
        day: 1,
        title: 'Cascade Embarkation Day',
        port: 'Miami, Florida',
        activitySchedule: [{ time: '12:00 PM', activity: 'Cascade boarding lunch' }]
      })

    expect(itineraryDayRes.statusCode).toBe(201)

    const activityRes = await request(app)
      .post(`/cruise/itinerary-days/${itineraryDayRes.body.id}/activities`)
      .send({
        time: '2:00 PM',
        activity: 'Cascade safety briefing'
      })

    expect(activityRes.statusCode).toBe(201)

    return {
      cruiseLineId: cruiseLineRes.body.id,
      shipId: shipRes.body.id,
      sailingId: sailingRes.body.id,
      itineraryDayId: itineraryDayRes.body.id,
      activityId: activityRes.body.id
    }
  }

  it('supports full API create, retrieve, update, and delete for ships', async () => {
    const cruiseLineRes = await request(app)
      .post('/cruise/cruise-line')
      .send({
        name: `Ship CRUD QA Cruise ${Date.now()}-${Math.random()}`,
        country: 'United States',
        website: 'https://example.com'
      })

    expect(cruiseLineRes.statusCode).toBe(201)

    const createShipRes = await request(app)
      .post('/cruise/ship')
      .send({
        name: `Ship CRUD QA Vessel ${Date.now()}-${Math.random()}`,
        currentPort: 'Port Canaveral, Florida',
        cruiseLineId: cruiseLineRes.body.id
      })

    expect(createShipRes.statusCode).toBe(201)

    const shipsAfterCreate = await request(app).get(`/cruise/ships/${cruiseLineRes.body.id}`)
    expect(shipsAfterCreate.statusCode).toBe(200)
    expect(shipsAfterCreate.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createShipRes.body.id,
          currentPort: 'Port Canaveral, Florida',
          cruiseLineId: cruiseLineRes.body.id
        })
      ])
    )

    const updateShipRes = await request(app)
      .patch(`/cruise/ship/${createShipRes.body.id}`)
      .send({
        name: 'Updated Ship CRUD QA Vessel',
        currentPort: 'Fort Lauderdale, Florida',
        cruiseLineId: cruiseLineRes.body.id
      })

    expect(updateShipRes.statusCode).toBe(200)

    const shipsAfterUpdate = await request(app).get(`/cruise/ships/${cruiseLineRes.body.id}`)
    expect(shipsAfterUpdate.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createShipRes.body.id,
          name: 'Updated Ship CRUD QA Vessel',
          currentPort: 'Fort Lauderdale, Florida'
        })
      ])
    )

    const deleteShipRes = await request(app).delete(`/cruise/ship/${createShipRes.body.id}`)
    expect(deleteShipRes.statusCode).toBe(200)

    const shipsAfterDelete = await request(app).get(`/cruise/ships/${cruiseLineRes.body.id}`)
    expect(
      shipsAfterDelete.statusCode === 404 ||
      shipsAfterDelete.body.every(ship => ship.id !== createShipRes.body.id)
    ).toBe(true)

    await request(app).delete(`/cruise/cruise-line/${cruiseLineRes.body.id}`)
  })

  it('cascades cruise line delete through ships, sailings, itinerary days, and activities', async () => {
    const hierarchy = await createFullCruiseHierarchy()

    const deleteCruiseLineRes = await request(app).delete(`/cruise/cruise-line/${hierarchy.cruiseLineId}`)
    expect(deleteCruiseLineRes.statusCode).toBe(200)

    const shipsRes = await request(app).get(`/cruise/ships/${hierarchy.cruiseLineId}`)
    const sailingsRes = await request(app).get(`/cruise/ship/${hierarchy.shipId}/sailings`)
    const itineraryRes = await request(app).get(`/cruise/sailings/${hierarchy.sailingId}/itinerary`)
    const activityUpdateRes = await request(app)
      .patch(`/cruise/activities/${hierarchy.activityId}`)
      .send({ time: '3:00 PM', activity: 'Should not exist' })

    expect(shipsRes.statusCode).toBe(404)
    expect(sailingsRes.statusCode).toBe(404)
    expect(itineraryRes.statusCode).toBe(404)
    expect(activityUpdateRes.statusCode).toBe(404)
  })

  it('cascades ship delete through sailings, itinerary days, and activities', async () => {
    const hierarchy = await createFullCruiseHierarchy()

    const deleteShipRes = await request(app).delete(`/cruise/ship/${hierarchy.shipId}`)
    expect(deleteShipRes.statusCode).toBe(200)

    const sailingsRes = await request(app).get(`/cruise/ship/${hierarchy.shipId}/sailings`)
    const itineraryRes = await request(app).get(`/cruise/sailings/${hierarchy.sailingId}/itinerary`)
    const dayUpdateRes = await request(app)
      .patch(`/cruise/itinerary-days/${hierarchy.itineraryDayId}`)
      .send({ day: 2, title: 'Should not exist', port: 'At Sea', activitySchedule: [] })
    const activityDeleteRes = await request(app).delete(`/cruise/activities/${hierarchy.activityId}`)

    expect(sailingsRes.statusCode).toBe(404)
    expect(itineraryRes.statusCode).toBe(404)
    expect(dayUpdateRes.statusCode).toBe(404)
    expect(activityDeleteRes.statusCode).toBe(404)

    await request(app).delete(`/cruise/cruise-line/${hierarchy.cruiseLineId}`)
  })

  it('cascades sailing delete through itinerary days and activities', async () => {
    const hierarchy = await createFullCruiseHierarchy()

    const deleteSailingRes = await request(app).delete(`/cruise/sailings/${hierarchy.sailingId}`)
    expect(deleteSailingRes.statusCode).toBe(200)

    const itineraryRes = await request(app).get(`/cruise/sailings/${hierarchy.sailingId}/itinerary`)
    const dayDeleteRes = await request(app).delete(`/cruise/itinerary-days/${hierarchy.itineraryDayId}`)
    const activityUpdateRes = await request(app)
      .patch(`/cruise/activities/${hierarchy.activityId}`)
      .send({ time: '3:00 PM', activity: 'Should not exist' })

    expect(itineraryRes.statusCode).toBe(404)
    expect(dayDeleteRes.statusCode).toBe(404)
    expect(activityUpdateRes.statusCode).toBe(404)

    await request(app).delete(`/cruise/cruise-line/${hierarchy.cruiseLineId}`)
  })

  it('cascades itinerary day delete through activities', async () => {
    const hierarchy = await createFullCruiseHierarchy()

    const deleteDayRes = await request(app).delete(`/cruise/itinerary-days/${hierarchy.itineraryDayId}`)
    expect(deleteDayRes.statusCode).toBe(200)

    const activityUpdateRes = await request(app)
      .patch(`/cruise/activities/${hierarchy.activityId}`)
      .send({ time: '3:00 PM', activity: 'Should not exist' })
    const activityDeleteRes = await request(app).delete(`/cruise/activities/${hierarchy.activityId}`)

    expect(activityUpdateRes.statusCode).toBe(404)
    expect(activityDeleteRes.statusCode).toBe(404)

    await request(app).delete(`/cruise/cruise-line/${hierarchy.cruiseLineId}`)
  })
})

