jest.mock('../../db', () => ({
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value }))
}))

const cruiseController = require('../../controllers/cruise.controller')
const db = require('../../db')
const mockResponse = require('./helpers/mockResponse')
const {
  mockSelect,
  mockSelectWhere,
  mockSelectWhereLimit,
  mockInsertReturning,
  mockUpdateWhere,
  mockDeleteWhere
} = require('./helpers/drizzleMocks')

const mockNext = jest.fn()

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

  const { fromMock } = mockSelect(db, fakeCruiseLines)

  await cruiseController.getCruiseLines(req, res, mockNext)

  expect(db.select).toHaveBeenCalledTimes(1)
  expect(fromMock).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith(fakeCruiseLines)
})

  it('should return 404 if no cruise lines exist', async () => {
    const req = {}
    const res = mockResponse()

    const { fromMock } = mockSelect(db, [])

    await cruiseController.getCruiseLines(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'No cruise lines found' })
  })
})

describe('Cruise Controller getCruiseLineById', () => {
  it('should have a getCruiseLineById function', () => {
    expect(typeof cruiseController.getCruiseLineById).toBe('function')
  })

  it('should select a cruise line by id', async () => {
    const req = { params: { id: '1' } }
    const res = mockResponse()
    const fakeCruiseLine = { id: '1', name: 'Royal Caribbean', country: 'USA' }

    const { fromMock, whereMock, limitMock } = mockSelectWhereLimit(db, [fakeCruiseLine])

    await cruiseController.getCruiseLineById(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(limitMock).toHaveBeenCalledWith(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(fakeCruiseLine)
  })

  it('should return 400 if id is missing', async () => {
    const req = { params: {} }
    const res = mockResponse()

    await cruiseController.getCruiseLineById(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line ID is required' })
    expect(db.select).not.toHaveBeenCalled()
  })

  it('should return 404 if cruise line does not exist', async () => {
    const req = { params: { id: '9999' } }
    const res = mockResponse()

    mockSelectWhereLimit(db, [])

    await cruiseController.getCruiseLineById(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line not found' })
  })
})

describe('Cruise Controller getShipsByCruiseLine', () => {
  it('should have a getShipsByCruiseLine function', () => {
    expect(typeof cruiseController.getShipsByCruiseLine).toBe('function')
  })

  it('should select ships by cruise line id', async () => {
    const req = { params: { cruiseLineId: '1' } }
    const res = mockResponse()
    const fakeShips = [
      { id: 'ship-1', name: 'Icon of the Seas', cruiseLineId: '1' },
      { id: 'ship-2', name: 'Wonder of the Seas', cruiseLineId: '1' }
    ]

    const { fromMock, whereMock } = mockSelectWhere(db, fakeShips)

    await cruiseController.getShipsByCruiseLine(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(fakeShips)
  })

  it('should return 404 if no ships are found', async () => {
    const req = { params: { cruiseLineId: '9999' } }
    const res = mockResponse()

    mockSelectWhere(db, [])

    await cruiseController.getShipsByCruiseLine(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'No ships found for the specified cruise line' })
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

    mockSelectWhereLimit(db, [])
    const insertedRows = [{ id: '1' }]
    const { returningMock, valuesMock } = mockInsertReturning(db, insertedRows)

    await cruiseController.insertCruiseLine(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith({
      name: 'Royal Caribbean',
      country: 'USA',
      website: 'https://www.royalcaribbean.com'
    })
    expect(returningMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line created successfully',
      id: '1'
    })
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

    mockSelectWhereLimit(db, [{ id: '1', name: 'Royal Caribbean' }])

    await cruiseController.insertCruiseLine(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line with the same name already exists' })
    expect(db.insert).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller insertShip', () => {
  it('should have a insertShip function', () => {
    expect(typeof cruiseController.insertShip).toBe('function')
  })

  it('should insert a ship successfully', async () => {
    const req = { body: { name: 'Icon of the Seas', cruiseLineId: '1' } }
    const res = mockResponse()

    const limitMock = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: '1' }])

    const whereMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })

    const { valuesMock } = mockInsertReturning(db, [{ id: 'ship-1' }])
    await cruiseController.insertShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith({
      name: 'Icon of the Seas',
      cruiseLineId: '1'
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship created successfully',
      id: 'ship-1'
    })
  })

  it('should return 400 if ship already exists', async () => {
    const req = { body: { name: 'Icon of the Seas', cruiseLineId: '1' } }
    const res = mockResponse()

    mockSelectWhereLimit(db, [{ id: 'ship-1', name: 'Icon of the Seas' }])

    await cruiseController.insertShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Ship with the same name already exists' })
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('should return 400 if cruise line id is invalid', async () => {
    const req = { body: { name: 'Icon of the Seas', cruiseLineId: '9999' } }
    const res = mockResponse()

    mockSelectWhereLimit(db, [])
    mockSelectWhereLimit(db, [])

    await cruiseController.insertShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid cruise line ID' })
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

    const limitMock = jest.fn()
      .mockResolvedValueOnce([{ id: '1', name: 'Royal Caribbean' }])
      .mockResolvedValueOnce([])

    const whereSelectMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereSelectMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })

    const { setMock, whereMock } = mockUpdateWhere(db)
    await cruiseController.updateCruiseLine(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(db.update).toHaveBeenCalledTimes(1)
    expect(setMock).toHaveBeenCalledWith({
      name: 'Royal Caribbean Updated',
      country: 'USA',
      website: 'https://www.royalcaribbean.com'
    })
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line updated successfully' })
  })

  it('should return 400 if id is missing', async () => {
    const req = { params: {}, body: { name: 'Royal Caribbean Updated' } }
    const res = mockResponse()

    await cruiseController.updateCruiseLine(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line ID is required' })
    expect(db.select).not.toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('should return 404 if cruise line is not found', async () => {
    const req = { params: { id: '999' }, body: { name: 'Royal Caribbean Updated' } }
    const res = mockResponse()

    mockSelectWhereLimit(db, [])

    await cruiseController.updateCruiseLine(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line not found' })
    expect(db.update).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller updateShip', () => {
  it('should have a updateShip function', () => {
    expect(typeof cruiseController.updateShip).toBe('function')
  })

  it('should update a ship successfully', async () => {
    const req = { params: { id: 'ship-1' }, body: { name: 'Icon Updated', cruiseLineId: 'line-1' } }
    const res = mockResponse()

    const limitMock = jest.fn()
      .mockResolvedValueOnce([{ id: 'ship-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'line-1' }])

    const whereSelectMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereSelectMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })

    const { setMock, whereMock } = mockUpdateWhere(db)
    await cruiseController.updateShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(3)
    expect(db.update).toHaveBeenCalledTimes(1)
    expect(setMock).toHaveBeenCalledWith({
      name: 'Icon Updated',
      cruiseLineId: 'line-1'
    })
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Ship updated successfully' })
  })

  it('should return 400 if cruise line id is invalid', async () => {
    const req = {
      params: { id: 'ship-1' },
      body: { name: 'Icon Updated', cruiseLineId: 'bad-line-id' }
    }
    const res = mockResponse()

    const limitMock = jest.fn()
      .mockResolvedValueOnce([{ id: 'ship-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const whereSelectMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereSelectMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })
    await cruiseController.updateShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(3)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid cruise line ID' })
    expect(db.update).not.toHaveBeenCalled()
  })

  it('should return 404 if ship is not found', async () => {
    const req = { params: { id: 'ship-999' }, body: { name: 'Icon Updated' } }
    const res = mockResponse()

    mockSelectWhereLimit(db, [])

    await cruiseController.updateShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Ship not found' })
    expect(db.update).not.toHaveBeenCalled()
  })

})

describe('Cruise Controller deleteCruiseLine', () => {
  it('should have a deleteCruiseLine function', () => {
    expect(typeof cruiseController.deleteCruiseLine).toBe('function')
  })

  it('should delete a cruise line and its ships', async () => {
  const req = { params: { id: 'line-1' } }
  const res = mockResponse()

  mockSelectWhereLimit(db, [{ id: 'line-1', name: 'Royal Caribbean' }])

  const whereMock = jest.fn().mockResolvedValue()

  db.delete = jest.fn().mockReturnValue({
    where: whereMock
  })

  await cruiseController.deleteCruiseLine(req, res, mockNext)

  expect(db.select).toHaveBeenCalledTimes(1)
  expect(db.delete).toHaveBeenCalledTimes(2)
  expect(whereMock).toHaveBeenCalledTimes(2)
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line deleted successfully' })
  }) 
  
  it('should return 400 if id is missing', async () => {
    const req = { params: {} }
    const res = mockResponse()

    await cruiseController.deleteCruiseLine(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line ID is required' })
    expect(db.select).not.toHaveBeenCalled()
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('should return 404 if cruise line does not exist', async () => {
    const req = { params: { id: 'line-999' } }
    const res = mockResponse()

    mockSelectWhereLimit(db, [])

    await cruiseController.deleteCruiseLine(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cruise line not found' })
    expect(db.delete).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller deleteShip', () => {
  it('should have a deleteShip function', () => {
    expect(typeof cruiseController.deleteShip).toBe('function')
  })

  it('should delete a ship successfully', async () => {
    const req = { params: { id: 'ship-1' } }
    const res = mockResponse()

    mockSelectWhereLimit(db, [{ id: 'ship-1' }])
    const { whereMock } = mockDeleteWhere(db)

    await cruiseController.deleteShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(db.delete).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Ship deleted successfully' })
  })

  it('should return 400 if id is missing', async () => {
    const req = { params: {} }
    const res = mockResponse()

    await cruiseController.deleteShip(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Ship ID is required' })
    expect(db.select).not.toHaveBeenCalled()
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('should return 404 if ship is not found', async () => {
    const req = { params: { id: 'ship-999' } }
    const res = mockResponse()

    mockSelectWhereLimit(db, [])

    await cruiseController.deleteShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Ship not found' })
    expect(db.delete).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller duplicate update validation', () => {
  it('should reject updating a cruise line to a name used by another cruise line', async () => {
    const req = {
      params: { id: 'line-1' },
      body: {
        name: 'Duplicate Cruise Line',
        country: 'USA',
        website: 'https://example.com'
      }
    }
    const res = mockResponse()

    const limitMock = jest.fn()
      .mockResolvedValueOnce([{ id: 'line-1', name: 'Original Cruise Line' }])
      .mockResolvedValueOnce([{ id: 'line-2', name: 'Duplicate Cruise Line' }])

    const whereSelectMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereSelectMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })

    await cruiseController.updateCruiseLine(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line with the same name already exists'
    })
    expect(db.update).not.toHaveBeenCalled()
  })

  it('should reject updating a ship to a name used by another ship', async () => {
    const req = {
      params: { id: 'ship-1' },
      body: {
        name: 'Duplicate Ship',
        cruiseLineId: 'line-1'
      }
    }
    const res = mockResponse()

    const limitMock = jest.fn()
      .mockResolvedValueOnce([{ id: 'ship-1', name: 'Original Ship' }])
      .mockResolvedValueOnce([{ id: 'ship-2', name: 'Duplicate Ship' }])

    const whereSelectMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereSelectMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })

    await cruiseController.updateShip(req, res, mockNext)

    expect(db.select).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ship with the same name already exists'
    })
    expect(db.update).not.toHaveBeenCalled()
  })
})

describe('Cruise Controller database error handling', () => {
  function mockSelectFromError(error) {
    const fromMock = jest.fn().mockRejectedValue(error)

    db.select = jest.fn().mockReturnValue({
      from: fromMock
    })

    return { fromMock }
  }

  function mockSelectWhereError(error) {
    const whereMock = jest.fn().mockRejectedValue(error)
    const fromMock = jest.fn().mockReturnValue({
      where: whereMock
    })

    db.select = jest.fn().mockReturnValue({
      from: fromMock
    })

    return { fromMock, whereMock }
  }

  function mockSelectWhereLimitError(error) {
    const limitMock = jest.fn().mockRejectedValue(error)
    const whereMock = jest.fn().mockReturnValue({
      limit: limitMock
    })
    const fromMock = jest.fn().mockReturnValue({
      where: whereMock
    })

    db.select = jest.fn().mockReturnValue({
      from: fromMock
    })

    return { fromMock, whereMock, limitMock }
  }

  it('should forward getCruiseLines database errors to next', async () => {
    const req = {}
    const res = mockResponse()
    const error = new Error('Database select failed')

    mockSelectFromError(error)

    await cruiseController.getCruiseLines(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should forward getCruiseLineById database errors to next', async () => {
    const req = { params: { id: 'line-1' } }
    const res = mockResponse()
    const error = new Error('Database lookup failed')

    mockSelectWhereLimitError(error)

    await cruiseController.getCruiseLineById(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should forward getShipsByCruiseLine database errors to next', async () => {
    const req = { params: { cruiseLineId: 'line-1' } }
    const res = mockResponse()
    const error = new Error('Ship lookup failed')

    mockSelectWhereError(error)

    await cruiseController.getShipsByCruiseLine(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should forward insertCruiseLine insert errors to next', async () => {
    const req = {
      body: {
        name: 'New Cruise Line',
        country: 'USA',
        website: 'https://example.com'
      }
    }
    const res = mockResponse()
    const error = new Error('Insert failed')

    mockSelectWhereLimit(db, [])

    const returningMock = jest.fn().mockRejectedValue(error)
    const valuesMock = jest.fn().mockReturnValue({ returning: returningMock })

    db.insert = jest.fn().mockReturnValue({
      values: valuesMock
    })

    await cruiseController.insertCruiseLine(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should forward insertShip insert errors to next', async () => {
    const req = {
      body: {
        name: 'New Ship',
        cruiseLineId: 'line-1'
      }
    }
    const res = mockResponse()
    const error = new Error('Ship insert failed')

    const limitMock = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'line-1' }])

    const whereSelectMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereSelectMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })

    const returningMock = jest.fn().mockRejectedValue(error)
    const valuesMock = jest.fn().mockReturnValue({ returning: returningMock })

    db.insert = jest.fn().mockReturnValue({
      values: valuesMock
    })

    await cruiseController.insertShip(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should forward updateCruiseLine update errors to next', async () => {
    const req = {
      params: { id: 'line-1' },
      body: {
        name: 'Updated Cruise Line',
        country: 'USA',
        website: 'https://example.com'
      }
    }
    const res = mockResponse()
    const error = new Error('Update failed')

    const limitMock = jest.fn()
      .mockResolvedValueOnce([{ id: 'line-1', name: 'Original Cruise Line' }])
      .mockResolvedValueOnce([])

    const whereSelectMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereSelectMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })

    const whereUpdateMock = jest.fn().mockRejectedValue(error)
    const setMock = jest.fn().mockReturnValue({ where: whereUpdateMock })

    db.update = jest.fn().mockReturnValue({
      set: setMock
    })

    await cruiseController.updateCruiseLine(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should forward updateShip update errors to next', async () => {
    const req = {
      params: { id: 'ship-1' },
      body: {
        name: 'Updated Ship',
        cruiseLineId: 'line-1'
      }
    }
    const res = mockResponse()
    const error = new Error('Ship update failed')

    const limitMock = jest.fn()
      .mockResolvedValueOnce([{ id: 'ship-1', name: 'Original Ship' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'line-1' }])

    const whereSelectMock = jest.fn().mockReturnValue({ limit: limitMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereSelectMock })

    db.select = jest.fn().mockReturnValue({ from: fromMock })

    const whereUpdateMock = jest.fn().mockRejectedValue(error)
    const setMock = jest.fn().mockReturnValue({ where: whereUpdateMock })

    db.update = jest.fn().mockReturnValue({
      set: setMock
    })

    await cruiseController.updateShip(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should forward deleteCruiseLine delete errors to next', async () => {
    const req = { params: { id: 'line-1' } }
    const res = mockResponse()
    const error = new Error('Delete failed')

    mockSelectWhereLimit(db, [{ id: 'line-1' }])

    const whereDeleteMock = jest.fn().mockRejectedValue(error)

    db.delete = jest.fn().mockReturnValue({
      where: whereDeleteMock
    })

    await cruiseController.deleteCruiseLine(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should forward deleteShip delete errors to next', async () => {
    const req = { params: { id: 'ship-1' } }
    const res = mockResponse()
    const error = new Error('Ship delete failed')

    mockSelectWhereLimit(db, [{ id: 'ship-1' }])

    const whereDeleteMock = jest.fn().mockRejectedValue(error)

    db.delete = jest.fn().mockReturnValue({
      where: whereDeleteMock
    })

    await cruiseController.deleteShip(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })
})

