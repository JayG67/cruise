const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const sailingTable = require('./sailing.model')

const turnaroundOperationTable = pgTable('turnaround_operations', {
  id: uuid().primaryKey().defaultRandom(),
  sailingId: uuid().references(() => sailingTable.id).notNull(),
  title: varchar({ length: 255 }).notNull(),
  turnaroundDate: varchar({ length: 20 }).notNull(),
  port: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 50 }).notNull(),
  readinessLevel: varchar({ length: 100 }).notNull(),
  notes: varchar({ length: 500 })
})

module.exports = turnaroundOperationTable
