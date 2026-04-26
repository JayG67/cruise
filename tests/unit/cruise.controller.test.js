const cruiseController = require('../../controllers/cruise.controller')
const db = require('../../db')

jest.mock('../../db')
jest.mock('drizzle-orm', () => ({
  eq: jest.fn()
}))

const mockResponse = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

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

    const allMock = jest.fn().mockResolvedValue(fakeCruiseLines)
    const fromMock = jest.fn().mockReturnValue({ all: allMock })

    db.select.mockReturnValue({
      from: fromMock
    })

    await cruiseController.getCruiseLines(req, res)

    expect(db.select).toHaveBeenCalled()
    expect(fromMock).toHaveBeenCalled()
    expect(allMock).toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(fakeCruiseLines)
  })
  it('should return 404 if no cruise lines exist', async () => {
    const req = {}
    const res = mockResponse()

    const fakeCruiseLines = []

    const noDataMock = jest.fn().mockResolvedValue(fakeCruiseLines)
    const fromMock = jest.fn().mockReturnValue({ all: noDataMock })

    db.select.mockReturnValue({
      from: fromMock
    })

    await cruiseController.getCruiseLines(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({"message": "No cruise lines found"})
  })
})

describe('Cruise Controller getCruiseLinesById', () => {
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

    const getMock = jest.fn().mockResolvedValue(fakeCruiseLine)
    const whereMock = jest.fn().mockReturnValue({ get: getMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereMock })

    db.select.mockReturnValue({
      from: fromMock
    })

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
      params: { id: '999' }
    }
    const res = mockResponse()

    const getMock = jest.fn().mockResolvedValue(null)
    const whereMock = jest.fn().mockReturnValue({ get: getMock })
    const fromMock = jest.fn().mockReturnValue({ where: whereMock })

    db.select.mockReturnValue({
      from: fromMock
    })

    await cruiseController.getCruiseLineById(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cruise line not found'
    })
  })
})

describe('Cruise Controller', () => {
  it('should have a getShipsByCruiseLine function', () => {
    expect(typeof cruiseController.getShipsByCruiseLine).toBe('function')
  })
})

describe('Cruise Controller', () => {
  it('should have a insertCruiseLine function', () => {
    expect(typeof cruiseController.insertCruiseLine).toBe('function')
  })
})

describe('Cruise Controller', () => {
  it('should have a insertShip function', () => {
    expect(typeof cruiseController.insertShip).toBe('function')
  })
})

describe('Cruise Controller', () => {
  it('should have a updateCruiseLine function', () => {
    expect(typeof cruiseController.updateCruiseLine).toBe('function')
  })
})

describe('Cruise Controller', () => {
  it('should have a updateShip function', () => {
    expect(typeof cruiseController.updateShip).toBe('function')
  })
})

describe('Cruise Controller', () => {
  it('should have a deleteCruiseLine function', () => {
    expect(typeof cruiseController.deleteCruiseLine).toBe('function')
  })
})

describe('Cruise Controller', () => {
  it('should have a deleteShip function', () => {
    expect(typeof cruiseController.deleteShip).toBe('function')
  })
})