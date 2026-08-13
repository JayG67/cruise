const fs = require('fs')

jest.mock('fs')

const { serverLogger } = require('../../middleware/loggers')

function createResponse(statusCode = 200) {
  let finishHandler
  return {
    statusCode,
    on: jest.fn((event, handler) => {
      if (event === 'finish') finishHandler = handler
    }),
    finish() {
      finishHandler?.()
    }
  }
}

describe('serverLogger middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('writes correlated method/path/status/latency data after the response finishes', () => {
    fs.appendFile.mockImplementation((file, content, callback) => callback(null))
    const next = jest.fn()
    const res = createResponse(200)

    serverLogger({ requestId: 'req-123', method: 'GET', path: '/health' }, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(fs.appendFile).not.toHaveBeenCalled()
    res.finish()

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true })
    expect(fs.appendFile).toHaveBeenCalledWith(
      expect.stringMatching(/logs[\\/]server\.log$/),
      expect.stringMatching(/requestId=req-123 method=GET path=\/health status=200 durationMs=\d+\.\d\n$/),
      expect.any(Function)
    )
  })

  test('reports asynchronous file-write failures without blocking the request', () => {
    const error = new Error('disk unavailable')
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    fs.appendFile.mockImplementation((file, content, callback) => callback(error))
    const next = jest.fn()
    const res = createResponse(500)

    serverLogger({ method: 'POST', path: '/cruise/bookings' }, res, next)
    expect(next).toHaveBeenCalledTimes(1)
    res.finish()

    expect(consoleSpy).toHaveBeenCalledWith('Failed to write to log file:', error)
    expect(fs.appendFile.mock.calls[0][1]).toContain('requestId=no-request-id')
    expect(fs.appendFile.mock.calls[0][1]).toContain('status=500')
    consoleSpy.mockRestore()
  })
})
