jest.setTimeout(30000)

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

  try {
    const db = require('../../db')

    if (typeof db.closePool === 'function') {
      await db.closePool()
      return
    }

    if (db.pool && !db.pool.ended) {
      await db.pool.end()
    }
  } catch (_err) {
    // Some focused unit tests mock or isolate modules. If db is unavailable,
    // there is no real pool to close for that test environment.
  }
})
