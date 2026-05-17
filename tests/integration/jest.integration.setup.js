const db = require('../../db')

jest.setTimeout(30000)

afterAll(async () => {
  if (typeof db.closePool === 'function') {
    await db.closePool()
    return
  }

  if (db.pool && !db.pool.ended) {
    await db.pool.end()
  }
})
