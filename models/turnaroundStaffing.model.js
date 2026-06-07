const { pgTable, uuid, varchar, integer } = require('drizzle-orm/pg-core')
const turnaroundOperationTable = require('./turnaroundOperation.model')

const turnaroundStaffingTable = pgTable('turnaround_staffing', {
  id: uuid().primaryKey().defaultRandom(),
  operationId: uuid().references(() => turnaroundOperationTable.id).notNull(),
  departmentRole: varchar({ length: 50 }).notNull(),
  plannedCount: integer().notNull().default(0),
  checkedInCount: integer().notNull().default(0),
  leadName: varchar({ length: 255 }),
  musterLocation: varchar({ length: 255 }),
  notes: varchar({ length: 500 })
})

module.exports = turnaroundStaffingTable
