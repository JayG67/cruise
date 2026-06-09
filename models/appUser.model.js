const { pgTable, varchar } = require('drizzle-orm/pg-core')
const customerTable = require('./customer.model')

const appUserTable = pgTable('app_users', {
  id: varchar({ length: 40 }).primaryKey(),
  displayName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  userType: varchar({ length: 50 }).notNull(),
  primaryCustomerId: varchar({ length: 10 }).references(() => customerTable.id),
  status: varchar({ length: 50 }).notNull()
})

module.exports = appUserTable
