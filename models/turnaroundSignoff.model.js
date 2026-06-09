const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const turnaroundOperationTable = require('./turnaroundOperation.model')
const appUserTable = require('./appUser.model')

const turnaroundSignoffTable = pgTable('turnaround_signoffs', {
  id: uuid().primaryKey().defaultRandom(),
  operationId: uuid().references(() => turnaroundOperationTable.id).notNull(),
  departmentRole: varchar({ length: 50 }).notNull(),
  approverName: varchar({ length: 255 }),
  approverUserId: varchar({ length: 40 }).references(() => appUserTable.id),
  status: varchar({ length: 50 }).notNull(),
  notes: varchar({ length: 500 }),
  signedAt: varchar({ length: 40 })
})

module.exports = turnaroundSignoffTable
