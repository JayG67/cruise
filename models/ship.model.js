const { pgTable, uuid, varchar, timestamp } = require('drizzle-orm/pg-core')
const cruiseLineTable = require('./cruiseline.model')

const shipTable = pgTable('ships', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  currentPort: varchar({ length: 255 }),
  cruiseLineId: uuid().references(() => cruiseLineTable.id).notNull(),
  createdAt: varchar({ length: 40 }),
  createdAtTimestamp: timestamp({ withTimezone: true }),
  updatedAt: varchar({ length: 40 }),
  updatedAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = shipTable
