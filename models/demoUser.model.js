const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const customerTable = require('./customer.model')
const appUserTable = require('./appUser.model')
const appRoleTable = require('./appRole.model')
const cruiseLineTable = require('./cruiseline.model')
const shipTable = require('./ship.model')

const demoUserTable = pgTable('demo_users', {
  id: varchar({ length: 20 }).primaryKey(),
  displayName: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).notNull(),
  customerId: varchar({ length: 10 }).references(() => customerTable.id),
  normalizedUserId: varchar({ length: 40 }).references(() => appUserTable.id),
  normalizedRoleId: varchar({ length: 50 }).references(() => appRoleTable.id),
  cruiseLineId: uuid().references(() => cruiseLineTable.id),
  assignedShipId: uuid().references(() => shipTable.id),
  cruiseLineName: varchar({ length: 255 }),
  assignedShipName: varchar({ length: 255 })
})

module.exports = demoUserTable
