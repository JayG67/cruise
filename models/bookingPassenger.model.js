const { pgTable, varchar, boolean, uuid, timestamp } = require('drizzle-orm/pg-core')
const bookingTable = require('./booking.model')
const customerTable = require('./customer.model')

const bookingPassengerTable = pgTable('booking_passengers', {
  id: varchar({ length: 30 }).primaryKey(),
  bookingPassengerUuid: uuid().defaultRandom(),
  bookingId: varchar({ length: 10 }).references(() => bookingTable.id).notNull(),
  customerId: varchar({ length: 10 }).references(() => customerTable.id).notNull(),
  passengerRole: varchar({ length: 50 }).notNull(),
  isPrimaryGuest: boolean().notNull().default(false),
  diningPreference: varchar({ length: 100 }),
  accessibilityNotes: varchar({ length: 255 }),
  boardingGroup: varchar({ length: 50 }),
  updatedAt: varchar({ length: 40 }),
  updatedAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = bookingPassengerTable
