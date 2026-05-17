const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const itineraryDayTable = require('./itineraryDay.model')

const activityScheduleTable = pgTable('activity_schedules', {
  id: uuid().primaryKey().defaultRandom(),
  itineraryDayId: uuid().references(() => itineraryDayTable.id).notNull(),
  time: varchar({ length: 20 }).notNull(),
  activity: varchar({ length: 255 }).notNull()
})

module.exports = activityScheduleTable
