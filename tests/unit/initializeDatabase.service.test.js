jest.mock('../../db', () => ({ execute: jest.fn() }))
jest.mock('../../services/databaseCompatibilityColumns.service', () => jest.fn())
jest.mock('../../services/databaseConstraintNormalization.service', () => jest.fn())
jest.mock('../../services/databaseIdentityMigration.service', () => jest.fn())
jest.mock('../../services/databaseEntityMetadataMigration.service', () => jest.fn())
jest.mock('../../services/databaseIndexProvisioning.service', () => jest.fn())
jest.mock('../../services/databaseRateLimitStoreMigration.service', () => jest.fn())

const db = require('../../db')
const applyDatabaseCompatibilityColumns = require('../../services/databaseCompatibilityColumns.service')
const applyDatabaseConstraintsAndTemporalNormalization = require('../../services/databaseConstraintNormalization.service')
const migrateDatabaseIdentityAndOperationalOwnership = require('../../services/databaseIdentityMigration.service')
const migrateDatabaseEntityMetadata = require('../../services/databaseEntityMetadataMigration.service')
const provisionDatabaseIndexes = require('../../services/databaseIndexProvisioning.service')
const provisionRateLimitStore = require('../../services/databaseRateLimitStoreMigration.service')
const initializeDatabase = require('../../services/initializeDatabase.service')

describe('initializeDatabase service', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalSuppressLogs = process.env.SUPPRESS_DB_LOGS

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    process.env.SUPPRESS_DB_LOGS = originalSuppressLogs
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('runs the complete migration chain and emits the non-test verification log', async () => {
    process.env.NODE_ENV = 'development'
    process.env.SUPPRESS_DB_LOGS = 'false'
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    db.execute.mockResolvedValue(undefined)

    await initializeDatabase()

    expect(db.execute.mock.calls.length).toBeGreaterThan(20)
    expect(applyDatabaseCompatibilityColumns).toHaveBeenCalledWith(db)
    expect(provisionRateLimitStore).toHaveBeenCalledWith(db)
    expect(migrateDatabaseIdentityAndOperationalOwnership).toHaveBeenCalledWith(db)
    expect(applyDatabaseConstraintsAndTemporalNormalization).toHaveBeenCalledWith(db)
    expect(migrateDatabaseEntityMetadata).toHaveBeenCalledWith(db)
    expect(provisionDatabaseIndexes).toHaveBeenCalledWith(db)
    expect(consoleSpy).toHaveBeenCalledWith('Database tables verified')
  })
})
