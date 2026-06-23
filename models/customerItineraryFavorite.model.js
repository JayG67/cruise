const { pgTable, varchar, uuid, timestamp } = require('drizzle-orm/pg-core')
const customerTable = require('./customer.model')
const activityScheduleTable = require('./activitySchedule.model')

const customerItineraryFavoriteTable = pgTable('customer_itinerary_favorites', {
  id: varchar({ length: 60 }).primaryKey(),
  favoriteUuid: uuid().defaultRandom(),
  customerId: varchar({ length: 10 }).references(() => customerTable.id).notNull(),
  activityScheduleId: uuid().references(() => activityScheduleTable.id).notNull(),
  createdAt: varchar({ length: 40 }),
  createdAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = customerItineraryFavoriteTable
