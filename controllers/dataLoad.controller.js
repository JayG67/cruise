const fs = require('fs')
const path = require('path')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const db = require('../db')
const { eq } = require('drizzle-orm')

exports.loadCruiseLines = async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'cruise.json')
    const fileContents = fs.readFileSync(filePath, 'utf-8')
    const cruiseData = JSON.parse(fileContents)

    for (const cruiseLine of cruiseData.cruiseLines) {
      const existingCruiseLine = await db
        .select()
        .from(cruiseLineTable)
        .where(eq(cruiseLineTable.name, cruiseLine.name))
        .limit(1)

      let cruiseLineId

      if (existingCruiseLine[0]) {
        cruiseLineId = existingCruiseLine[0].id
      } else {
        const insertedCruiseLine = await db
          .insert(cruiseLineTable)
          .values({
            name: cruiseLine.name,
            country: cruiseLine.country,
            website: cruiseLine.website
          })
          .returning({ id: cruiseLineTable.id })

        cruiseLineId = insertedCruiseLine[0].id
      }

      for (const ship of cruiseLine.ships) {
        const existingShip = await db
          .select()
          .from(shipTable)
          .where(eq(shipTable.name, ship.name))
          .limit(1)

        if (!existingShip[0]) {
          await db.insert(shipTable).values({
            name: ship.name,
            cruiseLineId
          })
        }
      }
    }

    return res.status(200).json({
      message: 'Cruise lines and ships loaded successfully'
    })
  } catch (err) {
    next(err)
  }
}