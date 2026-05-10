const db = require('../../db')

afterAll(async () => {
  await db.pool.end()
})