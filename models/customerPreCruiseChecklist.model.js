const { pgTable, varchar, boolean, timestamp, uuid } = require('drizzle-orm/pg-core')
const customerTable = require('./customer.model')

const customerPreCruiseChecklistTable = pgTable('customer_pre_cruise_checklists', {
  customerId: varchar({ length: 10 }).primaryKey().references(() => customerTable.id),
  checklistUuid: uuid().defaultRandom(),
  documents: boolean().notNull().default(false),
  luggage: boolean().notNull().default(false),
  dining: boolean().notNull().default(false),
  excursions: boolean().notNull().default(false),
  updatedAt: varchar({ length: 40 }),
  updatedAtTimestamp: timestamp({ withTimezone: true })
})

module.exports = customerPreCruiseChecklistTable
