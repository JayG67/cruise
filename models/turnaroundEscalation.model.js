const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const turnaroundOperationTable = require('./turnaroundOperation.model')
const appUserTable = require('./appUser.model')

const turnaroundEscalationTable = pgTable('turnaround_escalations', {
  id: uuid().primaryKey().defaultRandom(),
  operationId: uuid().references(() => turnaroundOperationTable.id).notNull(),
  departmentRole: varchar({ length: 50 }).notNull(),
  severity: varchar({ length: 50 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  ownerName: varchar({ length: 255 }),
  ownerUserId: varchar({ length: 40 }).references(() => appUserTable.id),
  status: varchar({ length: 50 }).notNull(),
  resolutionNotes: varchar({ length: 500 }),
  createdAt: varchar({ length: 40 }).notNull()
})

module.exports = turnaroundEscalationTable
