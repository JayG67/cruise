const { pgTable, uuid, varchar, integer, boolean, date, timestamp } = require('drizzle-orm/pg-core')
const shipTable = require('./ship.model')

const sailingTable = pgTable('sailings', {
  id: uuid().primaryKey().defaultRandom(),
  shipId: uuid().references(() => shipTable.id).notNull(),
  departureDate: varchar({ length: 20 }).notNull(),
  departureDateValue: date(),
  port: varchar({ length: 255 }).notNull(),
  departurePort: varchar({ length: 255 }).notNull(),
  arrivalPort: varchar({ length: 255 }).notNull(),
  days: integer().notNull(),
  isRepositioning: boolean().notNull().default(false),
  createdAt: varchar({ length: 40 }),
  createdAtTimestamp: timestamp({ withTimezone: true }),
  updatedAt: varchar({ length: 40 }),
  updatedAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = sailingTable
