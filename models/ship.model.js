const { pgTable, uuid, varchar } = require ('drizzle-orm/pg-core')

const shipTable = pgTable('ships', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  cruiseLineId: uuid().references(() => cruiseLineTable.id).notNull()
})

module.exports = shipTable