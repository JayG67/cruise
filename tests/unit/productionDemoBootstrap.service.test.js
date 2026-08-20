const {
  CANONICAL_CRUISE_LINE_NAMES,
  PORTFOLIO_ANCHOR_TABLES,
  bootstrapProductionDemoData,
  getProductionDemoBootstrapState,
  hasAnyBusinessData,
  hasCanonicalCruiseLineReferenceSet
} = require('../../services/productionDemoBootstrap.service')

function createDb(rowSets) {
  const queue = [...rowSets]
  return {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        limit: jest.fn(async () => queue.shift() ?? []),
        then: (resolve, reject) => Promise.resolve(queue.shift() ?? []).then(resolve, reject)
      }))
    }))
  }
}

function canonicalCruiseLineRows() {
  return CANONICAL_CRUISE_LINE_NAMES.map(name => ({ name }))
}

function emptyPortfolioAnchorRowSets() {
  return PORTFOLIO_ANCHOR_TABLES.map(() => [])
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

  it('seeds an initialized database when all business tables are empty', async () => {
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

  it('repairs the Render state where only the canonical eight cruise lines exist', async () => {
    const initialize = jest.fn().mockResolvedValue(undefined)
    const seed = jest.fn().mockResolvedValue({ cruiseLineCount: 8, customerCount: 12 })
    const dbClient = createDb([
      [{ id: 'existing-line' }],
      ...emptyPortfolioAnchorRowSets(),
      canonicalCruiseLineRows()
    ])

    await expect(bootstrapProductionDemoData({ confirmed: true, initialize, seed, dbClient }))
      .resolves.toEqual({
        seeded: true,
        reason: 'incomplete-demo-repair',
        counts: { cruiseLineCount: 8, customerCount: 12 }
      })

    expect(seed).toHaveBeenCalledTimes(1)
  })

  it('never resets a database when portfolio anchor data exists', async () => {
    const initialize = jest.fn().mockResolvedValue(undefined)
    const seed = jest.fn()
    const dbClient = createDb([
      [{ id: 'existing-line' }],
      [{ id: 'C000000001' }]
    ])

    await expect(bootstrapProductionDemoData({ confirmed: true, initialize, seed, dbClient }))
      .resolves.toEqual({ seeded: false, reason: 'database-not-empty' })

    expect(seed).not.toHaveBeenCalled()
  })

  it('does not repair arbitrary reference-only production data', async () => {
    const dbClient = createDb([
      [{ id: 'existing-line' }],
      ...emptyPortfolioAnchorRowSets(),
      [{ name: 'Private Cruise Line' }]
    ])

    await expect(getProductionDemoBootstrapState(dbClient)).resolves.toBe('populated')
  })

  it('recognizes the exact canonical cruise-line reference set regardless of ordering', async () => {
    const dbClient = createDb([canonicalCruiseLineRows().reverse()])
    await expect(hasCanonicalCruiseLineReferenceSet(dbClient)).resolves.toBe(true)
  })

  it('treats malformed empty query results conservatively and keeps checking', async () => {
    const dbClient = createDb([null, {}, [], [], [], []])
    await expect(hasAnyBusinessData(dbClient)).resolves.toBe(false)
  })
})
