const fs = require('fs')

jest.mock('fs')

const { serverLogger } = require('../../middleware/loggers')

describe('serverLogger middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('creates the log directory, appends a request line, and continues', () => {
    fs.appendFile.mockImplementation((file, content, callback) => callback(null))
    const next = jest.fn()

    serverLogger({ method: 'GET', path: '/health' }, {}, next)

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true })
    expect(fs.appendFile).toHaveBeenCalledWith(
      expect.stringMatching(/logs[\\/]server\.log$/),
      expect.stringMatching(/ - GET \/health\n$/),
      expect.any(Function),
    )
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('reports asynchronous file-write failures without blocking the request', () => {
    const error = new Error('disk unavailable')
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    fs.appendFile.mockImplementation((file, content, callback) => callback(error))
    const next = jest.fn()

    serverLogger({ method: 'POST', path: '/cruise/bookings' }, {}, next)

    expect(consoleSpy).toHaveBeenCalledWith('Failed to write to log file:', error)
    expect(next).toHaveBeenCalledTimes(1)
    consoleSpy.mockRestore()
  })
})
