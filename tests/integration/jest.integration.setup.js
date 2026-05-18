jest.setTimeout(30000)

const db = require('../../db')

afterAll(async () => {
  await db.pool.end()
})
