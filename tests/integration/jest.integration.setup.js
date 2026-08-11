jest.setTimeout(120000)

const db = require('../../db')
const databaseCleanupTasks = []

global.registerDatabaseCleanup = cleanup => {
  if (typeof cleanup !== 'function') {
    throw new TypeError('Database cleanup must be a function')
  }

  databaseCleanupTasks.push(cleanup)
}

afterAll(async () => {
  for (const cleanup of databaseCleanupTasks) {
    await cleanup()
  }

  if (typeof db.closePool === 'function') {
    await db.closePool()
    return
  }

  if (db.pool && !db.pool.ended) {
    await db.pool.end()
  }
})
