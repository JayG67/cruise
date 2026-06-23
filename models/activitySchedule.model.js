const { pgTable, uuid, varchar, timestamp } = require('drizzle-orm/pg-core')
const itineraryDayTable = require('./itineraryDay.model')

const activityScheduleTable = pgTable('activity_schedules', {
  id: uuid().primaryKey().defaultRandom(),
  itineraryDayId: uuid().references(() => itineraryDayTable.id).notNull(),
  time: varchar({ length: 20 }).notNull(),
  activity: varchar({ length: 255 }).notNull(),
  createdAt: varchar({ length: 40 }),
  createdAtTimestamp: timestamp({ withTimezone: true }),
  updatedAt: varchar({ length: 40 }),
  updatedAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = activityScheduleTable
