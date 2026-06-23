const { pgTable, uuid, varchar, timestamp } = require('drizzle-orm/pg-core')

const customerTable = pgTable('customers', {
  id: varchar({ length: 10 }).primaryKey(),
  customerUuid: uuid().defaultRandom(),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 50 }),
  loyaltyNumber: varchar({ length: 100 }),
  createdAt: varchar({ length: 40 }),
  createdAtTimestamp: timestamp({ withTimezone: true }),
  updatedAt: varchar({ length: 40 }),
  updatedAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = customerTable
