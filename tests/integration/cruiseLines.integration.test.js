const request = require('supertest')
const { randomUUID } = require('crypto')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const {
  uniqueName,
  createCruiseLine,
  cleanupTestData,
  trackCruiseLine,
  removeTrackedCruiseLine
} = require('./helpers/testDataFactory')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

afterEach(async () => {
  await cleanupTestData()
})

describe('Cruise line API integration tests', () => {
  it('GET /cruise should return seeded cruise lines', async () => {
    const res = await request(app).get('/cruise')

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('GET /cruise should return expected cruise line response shape', async () => {
    const res = await request(app).get('/cruise')

    expect(res.statusCode).toBe(200)

    res.body.forEach((cruiseLine) => {
      expect(cruiseLine).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String)
        })
      )

      expect(cruiseLine).toHaveProperty('country')
      expect(cruiseLine).toHaveProperty('website')
    })
  })

  it('GET /cruise/cruise-line/:id should return a specific cruise line', async () => {
    const cruiseLine = await createCruiseLine()

    const res = await request(app)
      .get(`/cruise/cruise-line/${cruiseLine.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        id: cruiseLine.id,
        name: cruiseLine.name,
        country: cruiseLine.country,
        website: cruiseLine.website
      })
    )
  })

  it('GET /cruise/cruise-line/:id should return 404 for a missing cruise line', async () => {
    const res = await request(app)
      .get(`/cruise/cruise-line/${randomUUID()}`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Cruise line not found' })
  })

  it('POST /cruise/cruise-line should create a cruise line', async () => {
    const payload = {
      name: uniqueName('Created Cruise Line'),
      country: 'United States',
      website: 'https://created.example.com'
    }

    const res = await request(app)
      .post('/cruise/cruise-line')
      .send(payload)

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({
      message: 'Cruise line created successfully',
      id: expect.any(String)
    })

    const createdId = res.body.id
    trackCruiseLine(createdId)

    const getRes = await request(app)
      .get(`/cruise/cruise-line/${createdId}`)

    expect(getRes.statusCode).toBe(200)
    expect(getRes.body).toEqual(
      expect.objectContaining({
        id: createdId,
        name: payload.name,
        country: payload.country,
        website: payload.website
      })
    )
  })

  it('POST /cruise/cruise-line should reject a missing cruise line name', async () => {
    const res = await request(app)
      .post('/cruise/cruise-line')
      .send({
        country: 'United States',
        website: 'https://missing-name.example.com'
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

  it('POST /cruise/cruise-line should reject a duplicate cruise line name', async () => {
    const cruiseLine = await createCruiseLine()

    const res = await request(app)
      .post('/cruise/cruise-line')
      .send({
        name: cruiseLine.name,
        country: 'United States',
        website: 'https://duplicate.example.com'
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      message: 'Cruise line with the same name already exists'
    })
  })

  it('POST /cruise/cruise-line should reject a blank cruise line name', async () => {
    const res = await request(app)
      .post('/cruise/cruise-line')
      .send({
        name: '   ',
        country: 'United States',
        website: 'https://example.com'
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
          field: 'name'
        })
      ])
    )
  })

  it('POST /cruise/cruise-line should reject an invalid website URL', async () => {
    const res = await request(app)
      .post('/cruise/cruise-line')
      .send({
        name: uniqueName('Invalid Website Cruise Line'),
        country: 'United States',
        website: 'not-a-real-url'
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
          field: 'website'
        })
      ])
    )
  })

  it('POST /cruise/cruise-line should reject unexpected fields', async () => {
    const res = await request(app)
      .post('/cruise/cruise-line')
      .send({
        name: uniqueName('Unexpected Field Cruise Line'),
        country: 'United States',
        website: 'https://example.com',
        hackerField: 'not allowed'
      })

    expect(res.statusCode).toBe(400)
  })

  it('PATCH /cruise/cruise-line/:id should update a cruise line', async () => {
    const cruiseLine = await createCruiseLine()

    const updatePayload = {
      name: uniqueName('Updated Cruise Line'),
      country: 'Canada',
      website: 'https://updated.example.com'
    }

    const res = await request(app)
      .patch(`/cruise/cruise-line/${cruiseLine.id}`)
      .send(updatePayload)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      message: 'Cruise line updated successfully'
    })

    const getRes = await request(app)
      .get(`/cruise/cruise-line/${cruiseLine.id}`)

    expect(getRes.statusCode).toBe(200)
    expect(getRes.body).toEqual(
      expect.objectContaining({
        id: cruiseLine.id,
        name: updatePayload.name,
        country: updatePayload.country,
        website: updatePayload.website
      })
    )
  })

  it('PATCH /cruise/cruise-line/:id should return 400 if id is missing', async () => {
    const res = await request(app)
      .patch('/cruise/cruise-line/')
      .send({
        name: uniqueName('Missing ID Update')
      })

    expect([404, 400]).toContain(res.statusCode)
  })

  it('PATCH /cruise/cruise-line/:id should return 404 for a missing cruise line', async () => {
    const res = await request(app)
      .patch(`/cruise/cruise-line/${randomUUID()}`)
      .send({
        name: uniqueName('Missing Cruise Line Update')
      })

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Cruise line not found' })
  })

  it('DELETE /cruise/cruise-line/:id should delete a cruise line', async () => {
    const cruiseLine = await createCruiseLine()

    const res = await request(app)
      .delete(`/cruise/cruise-line/${cruiseLine.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      message: 'Cruise line deleted successfully'
    })

    removeTrackedCruiseLine(cruiseLine.id)

    const getRes = await request(app)
      .get(`/cruise/cruise-line/${cruiseLine.id}`)

    expect(getRes.statusCode).toBe(404)
    expect(getRes.body).toEqual({ message: 'Cruise line not found' })
  })

  it('DELETE /cruise/cruise-line/:id should return 404 for a missing cruise line', async () => {
    const res = await request(app)
      .delete(`/cruise/cruise-line/${randomUUID()}`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Cruise line not found' })
  })

})