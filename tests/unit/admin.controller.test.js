jest.mock('../../services/loadCruiseData.service', () => jest.fn())
jest.mock('../../services/requestAuthorization.service', () => ({
  requireAdminRequest: jest.fn()
}))

const loadCruiseData = require('../../services/loadCruiseData.service')
const { requireAdminRequest } = require('../../services/requestAuthorization.service')
const adminController = require('../../controllers/admin.controller')
const mockResponse = require('./helpers/mockResponse')

describe('Admin Controller resetDemoData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireAdminRequest.mockResolvedValue(true)
  })

  it('should reset demo data and return metadata from the loader', async () => {
    const resetResult = {
      source: 'data/cruise.json',
      cruiseLineCount: 4,
      shipCount: 12,
      sailingCount: 60,
      itineraryDayCount: 300,
      activityCount: 900,
      customerCount: 10,
      bookingCount: 7,
      bookingPassengerCount: 14,
      demoUserCount: 3
    }

    loadCruiseData.mockResolvedValue(resetResult)

    const req = {}
    const res = mockResponse()
    const next = jest.fn()

    await adminController.resetDemoData(req, res, next)

    expect(loadCruiseData).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Demo data reset successfully',
      ...resetResult
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should forward loader errors to error middleware', async () => {
    const error = new Error('reset failed')

    loadCruiseData.mockRejectedValue(error)

    const req = {}
    const res = mockResponse()
    const next = jest.fn()

    await adminController.resetDemoData(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
