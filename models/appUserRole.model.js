const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const appUserTable = require('./appUser.model')
const appRoleTable = require('./appRole.model')
const cruiseLineTable = require('./cruiseline.model')
const shipTable = require('./ship.model')

const appUserRoleTable = pgTable('app_user_roles', {
  id: varchar({ length: 100 }).primaryKey(),
  userId: varchar({ length: 40 }).notNull().references(() => appUserTable.id),
  roleId: varchar({ length: 50 }).notNull().references(() => appRoleTable.id),
  assignmentScope: varchar({ length: 50 }).notNull(),
  cruiseLineId: uuid().references(() => cruiseLineTable.id),
  assignedShipId: uuid().references(() => shipTable.id),
  status: varchar({ length: 50 }).notNull()
})

module.exports = appUserRoleTable
