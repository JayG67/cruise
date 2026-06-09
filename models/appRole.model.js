const { pgTable, varchar } = require('drizzle-orm/pg-core')

const appRoleTable = pgTable('app_roles', {
  id: varchar({ length: 50 }).primaryKey(),
  displayName: varchar({ length: 255 }).notNull(),
  roleType: varchar({ length: 50 }).notNull(),
  description: varchar({ length: 500 })
})

module.exports = appRoleTable
