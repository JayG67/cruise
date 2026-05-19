const { pgTable, varchar } = require('drizzle-orm/pg-core')

const customerTable = pgTable('customers', {
  id: varchar({ length: 10 }).primaryKey(),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 50 }),
  loyaltyNumber: varchar({ length: 100 })
})

module.exports = customerTable
