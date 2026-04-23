const { pgTable, uuid, varchar } = require ('drizzle-orm/pg-core')

const shipTable = pgTable('ships', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  cruiseLineId: uuid().notNull()
})

module.exports = shipTable