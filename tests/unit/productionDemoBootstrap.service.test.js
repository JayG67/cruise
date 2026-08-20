const {
  bootstrapProductionDemoData,
  hasAnyBusinessData
} = require('../../services/productionDemoBootstrap.service')

function createDb(rowSets) {
  const queue = [...rowSets]
  return {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        limit: jest.fn(async () => queue.shift() ?? [])
      }))
    }))
  }
}

describe('production demo bootstrap', () => {
  it('requires explicit confirmation before any database work', async () => {
    const initialize = jest.fn()
    const seed = jest.fn()

    await expect(bootstrapProductionDemoData({ initialize, seed, dbClient: createDb([]) }))
      .rejects.toMatchObject({ code: 'PRODUCTION_DEMO_BOOTSTRAP_CONFIRMATION_REQUIRED' })

    expect(initialize).not.toHaveBeenCalled()
    expect(seed).not.toHaveBeenCalled()
  })

  it('seeds an initialized database only when all business tables are empty', async () => {
    const initialize = jest.fn().mockResolvedValue(undefined)
    const seed = jest.fn().mockResolvedValue({ cruiseLineCount: 8, customerCount: 12 })
    const dbClient = createDb([[], [], [], [], [], []])

    await expect(bootstrapProductionDemoData({ confirmed: true, initialize, seed, dbClient }))
      .resolves.toEqual({
        seeded: true,
        reason: 'empty-database-bootstrap',
        counts: { cruiseLineCount: 8, customerCount: 12 }
      })

    expect(initialize).toHaveBeenCalledTimes(1)
    expect(seed).toHaveBeenCalledTimes(1)
  })

  it('never resets a database when any business data already exists', async () => {
    const initialize = jest.fn().mockResolvedValue(undefined)
    const seed = jest.fn()
    const dbClient = createDb([[], [{ id: 'existing-ship' }]])

    await expect(bootstrapProductionDemoData({ confirmed: true, initialize, seed, dbClient }))
      .resolves.toEqual({ seeded: false, reason: 'database-not-empty' })

    expect(seed).not.toHaveBeenCalled()
    expect(dbClient.select).toHaveBeenCalledTimes(2)
  })

  it('treats malformed empty query results conservatively and keeps checking', async () => {
    const dbClient = createDb([null, {}, [], [], [], []])

    await expect(hasAnyBusinessData(dbClient)).resolves.toBe(false)
  })
})
