const { pgTable, uuid, varchar, text } = require('drizzle-orm/pg-core')
const appUserTable = require('./appUser.model')
const cruiseLineTable = require('./cruiseline.model')
const shipTable = require('./ship.model')
const sailingTable = require('./sailing.model')

const auditEventTable = pgTable('audit_events', {
  id: uuid().primaryKey().defaultRandom(),
  eventType: varchar({ length: 100 }).notNull(),
  entityType: varchar({ length: 100 }).notNull(),
  entityId: varchar({ length: 100 }).notNull(),
  actorUserId: varchar({ length: 40 }).references(() => appUserTable.id),
  actorDisplayName: varchar({ length: 255 }),
  cruiseLineId: uuid().references(() => cruiseLineTable.id),
  shipId: uuid().references(() => shipTable.id),
  sailingId: uuid().references(() => sailingTable.id),
  operationId: uuid(),
  source: varchar({ length: 100 }).notNull().default('APPLICATION'),
  eventPayload: text(),
  createdAt: varchar({ length: 40 }).notNull()
})

module.exports = auditEventTable
