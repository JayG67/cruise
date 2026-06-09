const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const turnaroundOperationTable = require('./turnaroundOperation.model')
const turnaroundTaskTable = require('./turnaroundTask.model')

const turnaroundTaskDependencyTable = pgTable('turnaround_task_dependencies', {
  id: uuid().primaryKey().defaultRandom(),
  operationId: uuid().references(() => turnaroundOperationTable.id).notNull(),
  taskId: uuid().references(() => turnaroundTaskTable.id).notNull(),
  dependsOnTaskId: uuid().references(() => turnaroundTaskTable.id).notNull(),
  dependencyType: varchar({ length: 50 }).notNull().default('BLOCKS'),
  status: varchar({ length: 50 }).notNull().default('ACTIVE'),
  notes: varchar({ length: 500 })
})

module.exports = turnaroundTaskDependencyTable
