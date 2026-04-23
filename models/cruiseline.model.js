const { pgTable, uuid, varchar } = require ('drizzle-orm/pg-core')

const cruiseLineTable = pgTable('cruise_lines', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  country: varchar({ length: 255 }),
  website: varchar({ length: 255 })
})