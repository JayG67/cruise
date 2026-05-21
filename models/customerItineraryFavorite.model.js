const { pgTable, varchar, uuid } = require('drizzle-orm/pg-core')
const customerTable = require('./customer.model')
const activityScheduleTable = require('./activitySchedule.model')

const customerItineraryFavoriteTable = pgTable('customer_itinerary_favorites', {
  id: varchar({ length: 60 }).primaryKey(),
  customerId: varchar({ length: 10 }).references(() => customerTable.id).notNull(),
  activityScheduleId: uuid().references(() => activityScheduleTable.id).notNull()
})

module.exports = customerItineraryFavoriteTable
