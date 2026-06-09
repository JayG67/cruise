const { pgTable, varchar } = require('drizzle-orm/pg-core')
const customerTable = require('./customer.model')
const appUserTable = require('./appUser.model')
const appRoleTable = require('./appRole.model')

const demoUserTable = pgTable('demo_users', {
  id: varchar({ length: 20 }).primaryKey(),
  displayName: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).notNull(),
  customerId: varchar({ length: 10 }).references(() => customerTable.id),
  normalizedUserId: varchar({ length: 40 }).references(() => appUserTable.id),
  normalizedRoleId: varchar({ length: 50 }).references(() => appRoleTable.id)
})

module.exports = demoUserTable
