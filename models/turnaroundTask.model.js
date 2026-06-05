const { pgTable, uuid, varchar, integer } = require('drizzle-orm/pg-core')
const turnaroundOperationTable = require('./turnaroundOperation.model')

const turnaroundTaskTable = pgTable('turnaround_tasks', {
  id: uuid().primaryKey().defaultRandom(),
  operationId: uuid().references(() => turnaroundOperationTable.id).notNull(),
  departmentRole: varchar({ length: 50 }).notNull(),
  taskName: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 50 }).notNull(),
  sortOrder: integer().notNull().default(0)
})

module.exports = turnaroundTaskTable
