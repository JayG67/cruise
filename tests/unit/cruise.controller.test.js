const cruiseController = require('../../controllers/cruise.controller')
const db = require('../../db')
const mockResponse = require('./helpers/mockResponse')
const {
  mockSelectGet,
  mockSelectAll,
  mockSelectWhereAll,
  mockInsertGet,
  mockUpdateRun,
  mockDeleteRun
} = require('./helpers/drizzleMocks')

jest.mock('../../db')
jest.mock('drizzle-orm', () => ({
  eq: jest.fn()
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Cruise Controller getCruiseLines', () => {
  it('should have a getCruiseLines function', () => {
    expect(typeof cruiseController.getCruiseLines).toBe('function')
  })

  it('should select all cruise lines from the database', async () => {
    const req = {}
    const res = mockResponse()

    const fakeCruiseLines = [
      { id: '1', name: 'Royal Caribbean', country: 'USA' },
      { id: '2', name: 'MSC', country: 'Italy' }
    ]

    const { allMock, fromMock } = mockSelectAll(db, fakeCruiseLines)

    await cruiseController.getCruiseLines(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(allMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(fakeCruiseLines)
  })

  it('should return 404 if no cruise lines exist', async () => {
    const req = {}
    const res = mockResponse()

    const { allMock, fromMock } = mockSelectAll(db, [])

    await cruiseController.getCruiseLines(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(allMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'No cruise lines found'
    })
  })
})

describe('Cruise Controller getCruiseLineById', () => {
  it('should have a getCruiseLineById function', () => {
    expect(typeof cruiseController.getCruiseLineById).toBe('function')
  })

  it('should select a cruise line by id', async () => {
    const req = {
      params: { id: '1' }
    }
    const res = mockResponse()

    const fakeCruiseLine = {
      id: '1',
      name: 'Royal Caribbean',
      country: 'USA'
    }

    const { getMock, whereMock, fromMock } = mockSelectGet(db, fakeCruiseLine)

    await cruiseController.getCruiseLineById(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(fakeCruiseLine)
  })

  it('should return 400 if id is missing', async () => {
    const req = { params: {} }
    const res = mockResponse()

    await cruiseController.getCruiseLineById(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line ID is required'
    })

    expect(db.select).not.toHaveBeenCalled()
  })

  it('should return 404 if cruise line does not exist', async () => {
    const req = {
      params: { id: '9999' }
    }
    const res = mockResponse()

    mockSelectGet(db, null)

    await cruiseController.getCruiseLineById(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line not found'
    })
  })
})

describe('Cruise Controller getShipsByCruiseLine', () => {
  it('should have a getShipsByCruiseLine function', () => {
    expect(typeof cruiseController.getShipsByCruiseLine).toBe('function')
  })

  it('should select ships by cruise line id', async () => {
    const req = {
      params: { cruiseLineId: '1' }
    }
    const res = mockResponse()

    const fakeShips = [
      { id: 'ship-1', name: 'Icon of the Seas', cruiseLineId: '1' },
      { id: 'ship-2', name: 'Wonder of the Seas', cruiseLineId: '1' }
    ]

    const { allMock, whereMock, fromMock } = mockSelectWhereAll(db, fakeShips)

    await cruiseController.getShipsByCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(allMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(fakeShips)
  })

  it('should return 404 if no ships are found', async () => {
    const req = {
      params: { cruiseLineId: '9999' }
    }
    const res = mockResponse()

    const { allMock, whereMock, fromMock } = mockSelectWhereAll(db, [])

    await cruiseController.getShipsByCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(allMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'No ships found for the specified cruise line'
    })
  })

  it('should return 404 if ships is null', async () => {
    const req = {
      params: { cruiseLineId: '9999' }
    }
    const res = mockResponse()

    const { allMock, whereMock, fromMock } = mockSelectWhereAll(db, null)

    await cruiseController.getShipsByCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(allMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'No ships found for the specified cruise line'
    })
  })
})

describe('Cruise Controller insertCruiseLine', () => {
  it('should have a insertCruiseLine function', () => {
    expect(typeof cruiseController.insertCruiseLine).toBe('function')
  })

  it('should insert a new cruise line', async () => {
    const req = {
      body: {
        name: 'Royal Caribbean',
        country: 'USA',
        website: 'https://www.royalcaribbean.com'
      }
    }
    const res = mockResponse()

    const { getMock, whereMock, fromMock } = mockSelectGet(db, null)

    const fakeId = { id: '1' }
    const { getMock: insertGetMock, returningMock, valuesMock } = mockInsertGet(db, fakeId)

    await cruiseController.insertCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith({
      name: 'Royal Caribbean',
      country: 'USA',
      website: 'https://www.royalcaribbean.com'
    })
    expect(returningMock).toHaveBeenCalledTimes(1)
    expect(insertGetMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line created successfully',
      id: fakeId
    })
  })

  it('should return 400 if cruise line name is missing', async () => {
    const req = {
      body: {
        country: 'USA',
        website: 'https://www.royalcaribbean.com'
      }
    }
    const res = mockResponse()

    await cruiseController.insertCruiseLine(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line name is required'
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('should return 400 if cruise line name is empty', async () => {
    const req = {
      body: {
        name: '',
        country: 'USA',
        website: 'https://www.royalcaribbean.com'
      }
    }
    const res = mockResponse()

    await cruiseController.insertCruiseLine(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line name is required'
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('should return 400 if cruise line already exists', async () => {
    const req = {
      body: {
        name: 'Royal Caribbean',
        country: 'USA',
        website: 'https://www.royalcaribbean.com'
      }
    }
    const res = mockResponse()

    const existingCruiseLine = {
      id: '1',
      name: 'Royal Caribbean'
    }

    const { getMock } = mockSelectGet(db, existingCruiseLine)

    await cruiseController.insertCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line with the same name already exists'
    })

    expect(db.insert).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller insertShip', () => {
  it('should have a insertShip function', () => {
    expect(typeof cruiseController.insertShip).toBe('function')
  })

  it('should insert a ship successfully', async () => {
    const req = {
      body: {
        name: 'Icon of the Seas',
        cruiseLineId: '1'
      }
    }
    const res = mockResponse()

    const { getMock: getShipMock } = mockSelectGet(db, null)
    const { getMock: getCruiseLineMock } = mockSelectGet(db, { id: '1' })

    const fakeId = { id: '1' }
    const { valuesMock } = mockInsertGet(db, fakeId)

    await cruiseController.insertShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(getShipMock).toHaveBeenCalledTimes(1)
    expect(getCruiseLineMock).toHaveBeenCalledTimes(1)

    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith({
      name: 'Icon of the Seas',
      cruiseLineId: '1'
    })

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship created successfully',
      id: fakeId
    })
  })

  it('should return 400 if ship name is missing', async () => {
    const req = {
      body: {
        cruiseLineId: '1'
      }
    }
    const res = mockResponse()

    await cruiseController.insertShip(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship name is required'
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('should return 400 if cruiseLineId is missing', async () => {
    const req = {
      body: {
        name: 'Icon of the Seas'
      }
    }
    const res = mockResponse()

    await cruiseController.insertShip(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line ID is required'
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('should return 400 if ship already exists', async () => {
    const req = {
      body: {
        name: 'Icon of the Seas',
        cruiseLineId: '1'
      }
    }
    const res = mockResponse()

    const existingShip = {
      id: 'ship-1',
      name: 'Icon of the Seas'
    }

    const { getMock: getShipMock } = mockSelectGet(db, existingShip)

    await cruiseController.insertShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getShipMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship with the same name already exists'
    })

    expect(db.insert).not.toHaveBeenCalled()
  })

  it('should return 400 if cruise line id is invalid', async () => {
    const req = {
      body: {
        name: 'Icon of the Seas',
        cruiseLineId: '9999'
      }
    }
    const res = mockResponse()

    const { getMock: getShipMock } = mockSelectGet(db, null)
    const { getMock: getCruiseLineMock } = mockSelectGet(db, null)

    await cruiseController.insertShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(getShipMock).toHaveBeenCalledTimes(1)
    expect(getCruiseLineMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid cruise line ID'
    })

    expect(db.insert).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller updateCruiseLine', () => {
  it('should have a updateCruiseLine function', () => {
    expect(typeof cruiseController.updateCruiseLine).toBe('function')
  })

  it('should update a cruise line successfully', async () => {
    const req = {
      params: { id: '1' },
      body: {
        name: 'Royal Caribbean Updated',
        country: 'USA',
        website: 'https://www.royalcaribbean.com'
      }
    }
    const res = mockResponse()

    const { getMock } = mockSelectGet(db, {
      id: '1',
      name: 'Royal Caribbean'
    })

    const { setMock, runMock } = mockUpdateRun(db)

    await cruiseController.updateCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(db.update).toHaveBeenCalledTimes(1)
    expect(setMock).toHaveBeenCalledWith({
      name: 'Royal Caribbean Updated',
      country: 'USA',
      website: 'https://www.royalcaribbean.com'
    })
    expect(runMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line updated successfully'
    })
  })

  it('should return 400 if id is missing', async () => {
    const req = {
      params: {},
      body: {
        name: 'Royal Caribbean Updated',
        country: 'USA',
        website: 'https://www.royalcaribbean.com'
      }
    }
    const res = mockResponse()

    await cruiseController.updateCruiseLine(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line ID is required'
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('should return 404 if cruise line is not found', async () => {
    const req = {
      params: { id: '999' },
      body: {
        name: 'Royal Caribbean Updated',
        country: 'USA',
        website: 'https://www.royalcaribbean.com'
      }
    }
    const res = mockResponse()

    const { getMock } = mockSelectGet(db, null)

    await cruiseController.updateCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line not found'
    })

    expect(db.update).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller updateShip', () => {
  it('should have a updateShip function', () => {
    expect(typeof cruiseController.updateShip).toBe('function')
  })

  it('should update a ship successfully', async () => {
    const req = {
      params: { id: 'ship-1' },
      body: {
        name: 'Icon of the Seas Updated',
        cruiseLineId: 'line-1'
      }
    }
    const res = mockResponse()

    const { getMock: getShipMock } = mockSelectGet(db, { id: 'ship-1' })
    const { getMock: getCruiseLineMock } = mockSelectGet(db, { id: 'line-1' })
    const { setMock, runMock } = mockUpdateRun(db)

    await cruiseController.updateShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(getShipMock).toHaveBeenCalledTimes(1)
    expect(getCruiseLineMock).toHaveBeenCalledTimes(1)

    expect(db.update).toHaveBeenCalledTimes(1)
    expect(setMock).toHaveBeenCalledWith({
      name: 'Icon of the Seas Updated',
      cruiseLineId: 'line-1'
    })
    expect(runMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship updated successfully'
    })
  })

  it('should update a ship without changing cruiseLineId', async () => {
    const req = {
      params: { id: 'ship-1' },
      body: {
        name: 'Icon of the Seas Updated'
      }
    }
    const res = mockResponse()

    const { getMock: getShipMock } = mockSelectGet(db, { id: 'ship-1' })
    const { setMock } = mockUpdateRun(db)

    await cruiseController.updateShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getShipMock).toHaveBeenCalledTimes(1)

    expect(db.update).toHaveBeenCalledTimes(1)
    expect(setMock).toHaveBeenCalledWith({
      name: 'Icon of the Seas Updated',
      cruiseLineId: undefined
    })

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship updated successfully'
    })
  })

  it('should return 400 if id is missing', async () => {
    const req = {
      params: {},
      body: {
        name: 'Icon of the Seas Updated',
        cruiseLineId: 'line-1'
      }
    }
    const res = mockResponse()

    await cruiseController.updateShip(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship ID is required'
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('should return 404 if ship is not found', async () => {
    const req = {
      params: { id: 'ship-999' },
      body: {
        name: 'Icon of the Seas Updated',
        cruiseLineId: 'line-1'
      }
    }
    const res = mockResponse()

    const { getMock: getShipMock } = mockSelectGet(db, null)

    await cruiseController.updateShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getShipMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship not found'
    })

    expect(db.update).not.toHaveBeenCalled()
  })

  it('should return 400 if cruise line id is invalid', async () => {
    const req = {
      params: { id: 'ship-1' },
      body: {
        name: 'Icon of the Seas Updated',
        cruiseLineId: 'bad-line-id'
      }
    }
    const res = mockResponse()

    const { getMock: getShipMock } = mockSelectGet(db, { id: 'ship-1' })
    const { getMock: getCruiseLineMock } = mockSelectGet(db, null)

    await cruiseController.updateShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(getShipMock).toHaveBeenCalledTimes(1)
    expect(getCruiseLineMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid cruise line ID'
    })

    expect(db.update).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller deleteCruiseLine', () => {
  it('should have a deleteCruiseLine function', () => {
    expect(typeof cruiseController.deleteCruiseLine).toBe('function')
  })

  it('should delete a cruise line and its ships', async () => {
    const req = {
      params: { id: 'line-1' }
    }
    const res = mockResponse()

    const { getMock } = mockSelectGet(db, {
      id: 'line-1',
      name: 'Royal Caribbean'
    })

    const { runMock: runShipsMock } = mockDeleteRun(db)
    const { runMock: runCruiseLineMock } = mockDeleteRun(db)

    await cruiseController.deleteCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(db.delete).toHaveBeenCalledTimes(2)
    expect(runShipsMock).toHaveBeenCalledTimes(1)
    expect(runCruiseLineMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line deleted successfully'
    })
  })

  it('should return 400 if id is missing', async () => {
    const req = {
      params: {}
    }
    const res = mockResponse()

    await cruiseController.deleteCruiseLine(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line ID is required'
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('should return 404 if cruise line does not exist', async () => {
    const req = {
      params: { id: 'line-999' }
    }
    const res = mockResponse()

    const { getMock } = mockSelectGet(db, null)

    await cruiseController.deleteCruiseLine(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line not found'
    })

    expect(db.delete).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller deleteShip', () => {
  it('should have a deleteShip function', () => {
    expect(typeof cruiseController.deleteShip).toBe('function')
  })

  it('should delete a ship successfully', async () => {
    const req = {
      params: { id: 'ship-1' }
    }
    const res = mockResponse()

    const { getMock } = mockSelectGet(db, { id: 'ship-1' })
    const { runMock } = mockDeleteRun(db)

    await cruiseController.deleteShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(db.delete).toHaveBeenCalledTimes(1)
    expect(runMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship deleted successfully'
    })
  })

  it('should return 400 if id is missing', async () => {
    const req = {
      params: {}
    }
    const res = mockResponse()

    await cruiseController.deleteShip(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship ID is required'
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('should return 404 if ship is not found', async () => {
    const req = {
      params: { id: 'ship-999' }
    }
    const res = mockResponse()

    const { getMock } = mockSelectGet(db, null)

    await cruiseController.deleteShip(req, res)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship not found'
    })

    expect(db.delete).not.toHaveBeenCalled()
  })
})