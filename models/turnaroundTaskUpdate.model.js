const { pgTable, uuid, varchar } = require('drizzle-orm/pg-core')
const turnaroundTaskTable = require('./turnaroundTask.model')
const appUserTable = require('./appUser.model')

const turnaroundTaskUpdateTable = pgTable('turnaround_task_updates', {
  id: uuid().primaryKey().defaultRandom(),
  taskId: uuid().references(() => turnaroundTaskTable.id).notNull(),
  authorName: varchar({ length: 255 }).notNull(),
  authorUserId: varchar({ length: 40 }).references(() => appUserTable.id),
  updateType: varchar({ length: 50 }).notNull(),
  message: varchar({ length: 500 }).notNull(),
  createdAt: varchar({ length: 40 }).notNull()
})

module.exports = turnaroundTaskUpdateTable
