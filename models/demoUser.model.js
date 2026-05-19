const { pgTable, varchar } = require('drizzle-orm/pg-core')
const customerTable = require('./customer.model')

const demoUserTable = pgTable('demo_users', {
  id: varchar({ length: 20 }).primaryKey(),
  displayName: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).notNull(),
  customerId: varchar({ length: 10 }).references(() => customerTable.id)
})

module.exports = demoUserTable
