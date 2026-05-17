const { pgTable, uuid, varchar, integer, boolean } = require('drizzle-orm/pg-core')
const shipTable = require('./ship.model')

const sailingTable = pgTable('sailings', {
  id: uuid().primaryKey().defaultRandom(),
  shipId: uuid().references(() => shipTable.id).notNull(),
  departureDate: varchar({ length: 10 }).notNull(),
  port: varchar({ length: 255 }).notNull(),
  departurePort: varchar({ length: 255 }),
  arrivalPort: varchar({ length: 255 }),
  days: integer().notNull(),
  isRepositioning: boolean().default(false)
})

module.exports = sailingTable
