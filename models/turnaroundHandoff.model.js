const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const turnaroundOperationTable = require('./turnaroundOperation.model')

const turnaroundHandoffTable = pgTable('turnaround_handoffs', {
  id: uuid().primaryKey().defaultRandom(),
  operationId: uuid().references(() => turnaroundOperationTable.id).notNull(),
  fromDepartmentRole: varchar({ length: 50 }).notNull(),
  toDepartmentRole: varchar({ length: 50 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 50 }).notNull().default('PENDING'),
  ownerName: varchar({ length: 255 }),
  dueTime: varchar({ length: 20 }),
  notes: varchar({ length: 500 }),
  completedAt: varchar({ length: 40 })
})

module.exports = turnaroundHandoffTable
