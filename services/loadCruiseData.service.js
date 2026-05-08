const fs = require('fs')
const path = require('path')
const { eq, and } = require('drizzle-orm')

const db = require('../db')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')

async function loadCruiseData() {
  const filePath = path.join(__dirname, '..', 'data', 'cruise.json')
  const fileContents = fs.readFileSync(filePath, 'utf-8')
  const cruiseData = JSON.parse(fileContents)

  for (const cruiseLine of cruiseData.cruiseLines || []) {
    const existingCruiseLines = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.name, cruiseLine.name))
      .limit(1)

    let cruiseLineId

    if (existingCruiseLines[0]) {
      cruiseLineId = existingCruiseLines[0].id
    } else {
      const insertedCruiseLines = await db
        .insert(cruiseLineTable)
        .values({
          name: cruiseLine.name,
          country: cruiseLine.country,
          website: cruiseLine.website
        })
        .returning({ id: cruiseLineTable.id })

      cruiseLineId = insertedCruiseLines[0].id
    }

    for (const ship of cruiseLine.ships || []) {
      const existingShips = await db
        .select()
        .from(shipTable)
        .where(
          and(
            eq(shipTable.name, ship.name),
            eq(shipTable.cruiseLineId, cruiseLineId)
          )
        )
        .limit(1)

      if (!existingShips[0]) {
        await db.insert(shipTable).values({
          name: ship.name,
          cruiseLineId
        })
      }
    }
  }

  console.log('Cruise seed data loaded')
}

module.exports = loadCruiseData