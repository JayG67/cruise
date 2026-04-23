const fs = require('fs')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const db = require('../db')
const { eq } = require('drizzle-orm')

exports.loadCruiseLines = async (req, res) => {
  const cruiseData = fs.readFileSync('../data/cruise.json', 'utf-8').parse()
  for (const cruiseLine of cruiseData) {
    if (db.select().from(cruiseLineTable).where(eq(cruiseLineTable.name, cruiseLine.name)).get())
      continue
    else {
      await db.insert(cruiseLineTable).values(cruiseLine).run()
      for (const ship of cruiseLine.ships) {
        if (db.select().from(shipTable).where(eq(shipTable.name, ship)).get())
          continue
        else
          await db.insert(shipTable).values({ name: ship, cruiseLineId: cruiseLine.id }).run()
      }
    }
  }

  return res.status(200).json({ message: 'Cruise lines and ships loaded successfully' })
}