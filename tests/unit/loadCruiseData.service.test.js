jest.mock('../../db', () => ({ transaction: jest.fn() }))
jest.mock('../../services/cruiseSeedRows.service', () => ({ buildSeedRows: jest.fn() }))

const fs = require('fs')
const db = require('../../db')
const { buildSeedRows } = require('../../services/cruiseSeedRows.service')

function seedRows(overrides = {}) {
  return {
    cruiseLineRows: [], shipRows: [], sailingRows: [], itineraryDayRows: [], activityRows: [], customerRows: [],
    appRoleRows: [], appUserRows: [], appUserRoleRows: [], bookingRows: [], bookingPassengerRows: [], demoUserRows: [],
    turnaroundOperationRows: [], turnaroundTaskRows: [], turnaroundTaskUpdateRows: [], turnaroundSignoffRows: [],
    turnaroundEscalationRows: [], turnaroundStaffingRows: [], turnaroundTaskDependencyRows: [], turnaroundHandoffRows: [],
    ...overrides
  }
}

describe('loadCruiseData service', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalSuppressLogs = process.env.SUPPRESS_DB_LOGS

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    process.env.SUPPRESS_DB_LOGS = originalSuppressLogs
    jest.restoreAllMocks()
    jest.resetModules()
  })

  it('deduplicates concurrent resets, caches the parsed seed file, chunks inserts, and reports all counts', async () => {
    process.env.NODE_ENV = 'development'
    process.env.SUPPRESS_DB_LOGS = 'false'
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const readSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue('{"cruiseLines":[]}')
    const rows = seedRows({ cruiseLineRows: Array.from({ length: 501 }, (_, index) => ({ id: `line-${index}` })) })
    buildSeedRows.mockReturnValue(rows)

    const tx = {
      delete: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn(() => ({ values: jest.fn().mockResolvedValue(undefined) }))
    }
    db.transaction.mockImplementation(async callback => callback(tx))

    const loadCruiseData = require('../../services/loadCruiseData.service')
    const [first, second] = await Promise.all([loadCruiseData(), loadCruiseData()])

    expect(db.transaction).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
    expect(first).toEqual(expect.objectContaining({ cruiseLineCount: 501, source: 'data/cruise.json' }))
    expect(tx.insert).toHaveBeenCalledTimes(2)
    expect(readSpy).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenCalledWith('Cruise seed data reset from data/cruise.json')

    await loadCruiseData()
    expect(db.transaction).toHaveBeenCalledTimes(2)
    expect(readSpy).toHaveBeenCalledTimes(1)
  })
})
