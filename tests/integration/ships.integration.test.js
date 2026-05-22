const request = require('supertest')
const { randomUUID } = require('crypto')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const {
  uniqueName,
  createCruiseLine,
  createShip,
  cleanupTestData,
  removeTrackedShip,
  removeTrackedCruiseLine
} = require('./helpers/testDataFactory')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

afterEach(async () => {
  await cleanupTestData()
})

describe('Ship API integration tests', () => {
  it('GET /cruise/ships/:cruiseLineId should return ships for a seeded cruise line', async () => {
    const cruiseRes = await request(app).get('/cruise')

    expect(cruiseRes.statusCode).toBe(200)
    expect(cruiseRes.body.length).toBeGreaterThan(0)

    let seededCruiseLineWithShips
    let shipRes

    for (const cruiseLine of cruiseRes.body) {
      const candidateShipRes = await request(app)
        .get(`/cruise/ships/${cruiseLine.id}`)

      if (candidateShipRes.statusCode === 200 && candidateShipRes.body.length > 0) {
        seededCruiseLineWithShips = cruiseLine
        shipRes = candidateShipRes
        break
      }
    }

    expect(seededCruiseLineWithShips).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String)
      })
    )

    expect(shipRes.statusCode).toBe(200)
    expect(Array.isArray(shipRes.body)).toBe(true)
    expect(shipRes.body.length).toBeGreaterThan(0)

    shipRes.body.forEach((ship) => {
      expect(ship).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          cruiseLineId: seededCruiseLineWithShips.id
        })
      )
    })
  })

  it('GET /cruise/ships/:cruiseLineId should return 404 for a cruise line with no ships', async () => {
    const cruiseLine = await createCruiseLine()

    const res = await request(app)
      .get(`/cruise/ships/${cruiseLine.id}`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({
      message: 'No ships found for the specified cruise line'
    })
  })

  it('POST /cruise/ship should create a ship', async () => {
    const cruiseLine = await createCruiseLine()

    const payload = {
      name: uniqueName('Created Ship'),
      currentPort: 'Miami, Florida',
      cruiseLineId: cruiseLine.id
    }

    const res = await request(app)
      .post('/cruise/ship')
      .send(payload)

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({
      message: 'Ship created successfully',
      id: expect.any(String)
    })

    const createdShipId = res.body.id

    const shipsRes = await request(app)
      .get(`/cruise/ships/${cruiseLine.id}`)

    expect(shipsRes.statusCode).toBe(200)
    expect(shipsRes.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdShipId,
          name: payload.name,
          cruiseLineId: cruiseLine.id
        })
      ])
    )
  })

  it('POST /cruise/ship should reject a missing ship name', async () => {
    const cruiseLine = await createCruiseLine()

    const res = await request(app)
      .post('/cruise/ship')
      .send({
        currentPort: 'Miami, Florida',
        cruiseLineId: cruiseLine.id
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name'
          })
        ])
      })
    )  
  })

  it('POST /cruise/ship should reject a missing cruiseLineId', async () => {
    const res = await request(app)
      .post('/cruise/ship')
      .send({
        name: uniqueName('Missing Cruise Line Ship')
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'cruiseLineId'
          })
        ])
      })
    )
  })

  it('POST /cruise/ship should reject an invalid cruiseLineId', async () => {
    const res = await request(app)
      .post('/cruise/ship')
      .send({
        name: uniqueName('Invalid Cruise Line Ship'),
        currentPort: 'Miami, Florida',
        cruiseLineId: randomUUID()
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Invalid cruise line ID' })  
  })

  it('POST /cruise/ship should reject invalid cruiseLineId UUID format', async () => {
    const res = await request(app)
      .post('/cruise/ship')
      .send({
        name: uniqueName('Invalid UUID Ship'),
        currentPort: 'Miami, Florida',
        cruiseLineId: 'not-a-uuid'
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'cruiseLineId'
          })
        ])
      })
    )
  })

  it('POST /cruise/ship should reject a duplicate ship name', async () => {
    const cruiseLine = await createCruiseLine()
    const ship = await createShip(cruiseLine.id)

    const res = await request(app)
      .post('/cruise/ship')
      .send({
        name: ship.name,
        currentPort: 'Miami, Florida',
        cruiseLineId: cruiseLine.id
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      message: 'Ship with the same name already exists'
    })
  })

  it('POST /cruise/ship should reject a blank ship name', async () => {
    const cruiseLine = await createCruiseLine()

    const res = await request(app)
      .post('/cruise/ship')
      .send({
        name: '   ',
        currentPort: 'Miami, Florida',
        cruiseLineId: cruiseLine.id
      })

    expect(res.statusCode).toBe(400)

    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed'
      })
    )
  })

  it('POST /cruise/ship should reject an invalid UUID format', async () => {
    const res = await request(app)
      .post('/cruise/ship')
      .send({
        name: uniqueName('Invalid UUID Ship'),
        currentPort: 'Miami, Florida',
        cruiseLineId: 'not-a-uuid'
      })

    expect(res.statusCode).toBe(400)

    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed'
      })
    )

    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'cruiseLineId'
        })
      ])
    )
  })

  it('PATCH /cruise/ship/:id should update a ship name', async () => {
    const cruiseLine = await createCruiseLine()
    const ship = await createShip(cruiseLine.id)

    const updatedName = uniqueName('Updated Ship')

    const res = await request(app)
      .patch(`/cruise/ship/${ship.id}`)
      .send({
        name: updatedName,
        currentPort: ship.currentPort,
        cruiseLineId: cruiseLine.id
      })

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      message: 'Ship updated successfully'
    })

    const shipsRes = await request(app)
      .get(`/cruise/ships/${cruiseLine.id}`)

    expect(shipsRes.statusCode).toBe(200)
    expect(shipsRes.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: ship.id,
          name: updatedName,
          cruiseLineId: cruiseLine.id
        })
      ])
    )
  })

  it('PATCH /cruise/ship/:id should move a ship to another cruise line', async () => {
    const originalCruiseLine = await createCruiseLine()
    const newCruiseLine = await createCruiseLine()
    const ship = await createShip(originalCruiseLine.id)

    const res = await request(app)
      .patch(`/cruise/ship/${ship.id}`)
      .send({
        name: ship.name,
        currentPort: ship.currentPort,
        cruiseLineId: newCruiseLine.id
      })

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      message: 'Ship updated successfully'
    })

    const newCruiseLineShipsRes = await request(app)
      .get(`/cruise/ships/${newCruiseLine.id}`)

    expect(newCruiseLineShipsRes.statusCode).toBe(200)
    expect(newCruiseLineShipsRes.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: ship.id,
          name: ship.name,
          cruiseLineId: newCruiseLine.id
        })
      ])
    )
  })

  it('PATCH /cruise/ship/:id should reject an invalid cruiseLineId', async () => {
    const cruiseLine = await createCruiseLine()
    const ship = await createShip(cruiseLine.id)

    const res = await request(app)
      .patch(`/cruise/ship/${ship.id}`)
      .send({
        name: ship.name,
        currentPort: ship.currentPort,
        cruiseLineId: randomUUID()
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Invalid cruise line ID' })
  })

  it('PATCH /cruise/ship/:id should return 404 for a missing ship', async () => {
    const cruiseLine = await createCruiseLine()

    const res = await request(app)
      .patch(`/cruise/ship/${randomUUID()}`)
      .send({
        name: uniqueName('Missing Ship Update'),
        currentPort: 'Nowhere',
        cruiseLineId: cruiseLine.id
      })

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Ship not found' })
  })

  it('DELETE /cruise/ship/:id should delete a ship', async () => {
    const cruiseLine = await createCruiseLine()
    const ship = await createShip(cruiseLine.id)

    const res = await request(app)
      .delete(`/cruise/ship/${ship.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      message: 'Ship deleted successfully'
    })

    removeTrackedShip(ship.id)

    const shipsRes = await request(app)
      .get(`/cruise/ships/${cruiseLine.id}`)

    expect(shipsRes.statusCode).toBe(404)
    expect(shipsRes.body).toEqual({
      message: 'No ships found for the specified cruise line'
    })
  })

  it('DELETE /cruise/ship/:id should return 404 for a missing ship', async () => {
    const res = await request(app)
      .delete(`/cruise/ship/${randomUUID()}`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Ship not found' })
  })

  it('DELETE /cruise/cruise-line/:id should delete a cruise line and cascade ships', async () => {
    const cruiseLine = await createCruiseLine()
    const ship = await createShip(cruiseLine.id)

    const res = await request(app)
      .delete(`/cruise/cruise-line/${cruiseLine.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      message: 'Cruise line deleted successfully'
    })

    removeTrackedCruiseLine(cruiseLine.id)
    removeTrackedShip(ship.id)

    const cruiseLineRes = await request(app)
      .get(`/cruise/cruise-line/${cruiseLine.id}`)

    expect(cruiseLineRes.statusCode).toBe(404)

    const shipsRes = await request(app)
      .get(`/cruise/ships/${cruiseLine.id}`)

    expect(shipsRes.statusCode).toBe(404)
    expect(shipsRes.body).toEqual({
      message: 'No ships found for the specified cruise line'
    })
  })
})