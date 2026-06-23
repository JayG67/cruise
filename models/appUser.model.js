const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const customerTable = require('./customer.model')
const cruiseLineTable = require('./cruiseline.model')
const shipTable = require('./ship.model')

const appUserTable = pgTable('app_users', {
  id: varchar({ length: 40 }).primaryKey(),
  displayName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  userType: varchar({ length: 50 }).notNull(),
  primaryCustomerId: varchar({ length: 10 }).references(() => customerTable.id),
  cruiseLineId: uuid().references(() => cruiseLineTable.id),
  assignedShipId: uuid().references(() => shipTable.id, { onDelete: 'set null' }),
  status: varchar({ length: 50 }).notNull()
})

module.exports = appUserTable
