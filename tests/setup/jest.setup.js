jest.setTimeout(30000)

afterAll(async () => {
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
