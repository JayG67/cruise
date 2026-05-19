const { pgTable, varchar, uuid } = require('drizzle-orm/pg-core')
const sailingTable = require('./sailing.model')
const customerTable = require('./customer.model')

const bookingTable = pgTable('bookings', {
  id: varchar({ length: 10 }).primaryKey(),
  sailingId: uuid().references(() => sailingTable.id).notNull(),
  bookingStatus: varchar({ length: 50 }).notNull(),
  cabinNumber: varchar({ length: 20 }),
  fareCode: varchar({ length: 50 }),
  embarkationPort: varchar({ length: 255 }),
  debarkationPort: varchar({ length: 255 }),
  createdByCustomerId: varchar({ length: 10 }).references(() => customerTable.id)
})

module.exports = bookingTable
