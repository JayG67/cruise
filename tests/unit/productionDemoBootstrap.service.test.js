const {
  CANONICAL_CRUISE_LINE_NAMES,
  PORTFOLIO_ANCHOR_TABLES,
  bootstrapProductionDemoData,
  getProductionDemoBootstrapState,
  hasAnyBusinessData,
  hasCanonicalCruiseLineReferenceSet,
  hasCompletePortfolioAnchorData
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

function completePortfolioAnchorRowSets() {
  return PORTFOLIO_ANCHOR_TABLES.map((table, index) => [{ id: `anchor-${index}-${String(table)}` }])
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
        state: 'empty',
        counts: { cruiseLineCount: 8, customerCount: 12 }
      })

    expect(initialize).toHaveBeenCalledTimes(1)
    expect(seed).toHaveBeenCalledTimes(1)
  })

  it('repairs canonical reference data when required portfolio content anchors are missing', async () => {
    const initialize = jest.fn().mockResolvedValue(undefined)
    const seed = jest.fn().mockResolvedValue({ cruiseLineCount: 8, customerCount: 12 })
    const dbClient = createDb([
      [{ id: 'existing-line' }],
      [],
      canonicalCruiseLineRows()
    ])

    await expect(bootstrapProductionDemoData({ confirmed: true, initialize, seed, dbClient }))
      .resolves.toEqual({
        seeded: true,
        reason: 'incomplete-demo-repair',
        state: 'incomplete-demo-dataset',
        counts: { cruiseLineCount: 8, customerCount: 12 }
      })

    expect(seed).toHaveBeenCalledTimes(1)
  })

  it('does not let derived identity rows hide a missing customer/booking/demo-user dataset', async () => {
    const dbClient = createDb([
      [{ id: 'existing-line' }],
      [],
      canonicalCruiseLineRows()
    ])

    await expect(getProductionDemoBootstrapState(dbClient)).resolves.toBe('incomplete-demo-dataset')
    expect(PORTFOLIO_ANCHOR_TABLES).toHaveLength(3)
  })

  it('never resets a database when all required portfolio content anchors exist', async () => {
    const initialize = jest.fn().mockResolvedValue(undefined)
    const seed = jest.fn()
    const dbClient = createDb([
      [{ id: 'existing-line' }],
      ...completePortfolioAnchorRowSets()
    ])

    await expect(bootstrapProductionDemoData({ confirmed: true, initialize, seed, dbClient }))
      .resolves.toEqual({ seeded: false, reason: 'database-not-empty', state: 'populated' })

    expect(seed).not.toHaveBeenCalled()
  })

  it('does not repair arbitrary reference-only production data', async () => {
    const dbClient = createDb([
      [{ id: 'existing-line' }],
      [],
      [{ name: 'Private Cruise Line' }]
    ])

    await expect(getProductionDemoBootstrapState(dbClient)).resolves.toBe('populated')
  })

  it('recognizes the exact canonical cruise-line reference set regardless of ordering', async () => {
    const dbClient = createDb([canonicalCruiseLineRows().reverse()])
    await expect(hasCanonicalCruiseLineReferenceSet(dbClient)).resolves.toBe(true)
  })

  it('requires every portfolio anchor and treats malformed empty query results conservatively', async () => {
    await expect(hasCompletePortfolioAnchorData(createDb([[{ id: 'customer' }], [{ id: 'booking' }], []]))).resolves.toBe(false)
    await expect(hasCompletePortfolioAnchorData(createDb(completePortfolioAnchorRowSets()))).resolves.toBe(true)
    await expect(hasAnyBusinessData(createDb([null, {}, [], [], [], []]))).resolves.toBe(false)
  })
})
