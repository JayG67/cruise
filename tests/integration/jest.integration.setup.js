jest.setTimeout(120000)

const db = require('../../db')

afterAll(async () => {
  if (typeof db.closePool === 'function') {
    await db.closePool()
    return
  }

  if (db.pool && !db.pool.ended) {
    await db.pool.end()
  }
})
