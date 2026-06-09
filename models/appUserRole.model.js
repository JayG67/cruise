const { pgTable, varchar } = require('drizzle-orm/pg-core')
const appUserTable = require('./appUser.model')
const appRoleTable = require('./appRole.model')

const appUserRoleTable = pgTable('app_user_roles', {
  id: varchar({ length: 100 }).primaryKey(),
  userId: varchar({ length: 40 }).notNull().references(() => appUserTable.id),
  roleId: varchar({ length: 50 }).notNull().references(() => appRoleTable.id),
  assignmentScope: varchar({ length: 50 }).notNull(),
  status: varchar({ length: 50 }).notNull()
})

module.exports = appUserRoleTable
