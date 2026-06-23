const { pgTable, uuid, varchar, integer, timestamp } = require('drizzle-orm/pg-core')
const sailingTable = require('./sailing.model')

const itineraryDayTable = pgTable('itinerary_days', {
  id: uuid().primaryKey().defaultRandom(),
  sailingId: uuid().references(() => sailingTable.id).notNull(),
  day: integer().notNull(),
  title: varchar({ length: 255 }).notNull(),
  port: varchar({ length: 255 }).notNull(),
  createdAt: varchar({ length: 40 }),
  createdAtTimestamp: timestamp({ withTimezone: true }),
  updatedAt: varchar({ length: 40 }),
  updatedAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = itineraryDayTable
