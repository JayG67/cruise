const { pgTable, varchar, uuid, timestamp } = require('drizzle-orm/pg-core')
const sailingTable = require('./sailing.model')
const customerTable = require('./customer.model')
const appUserTable = require('./appUser.model')

const bookingTable = pgTable('bookings', {
  id: varchar({ length: 10 }).primaryKey(),
  bookingUuid: uuid().defaultRandom(),
  sailingId: uuid().references(() => sailingTable.id).notNull(),
  bookingStatus: varchar({ length: 50 }).notNull(),
  cabinNumber: varchar({ length: 20 }),
  fareCode: varchar({ length: 50 }),
  embarkationPort: varchar({ length: 255 }),
  debarkationPort: varchar({ length: 255 }),
  createdByCustomerId: varchar({ length: 10 }).references(() => customerTable.id),
  createdByUserId: varchar({ length: 40 }).references(() => appUserTable.id, { onDelete: 'set null' }),
  createdAt: varchar({ length: 40 }),
  createdAtTimestamp: timestamp({ withTimezone: true }),
  updatedAt: varchar({ length: 40 }),
  updatedAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = bookingTable
