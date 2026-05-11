const fs = require('fs')
const path = require('path')

const db = require('../db')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')

async function loadCruiseData() {
  const filePath = path.join(__dirname, '..', 'data', 'cruise.json')
  const fileContents = fs.readFileSync(filePath, 'utf-8')
  const cruiseData = JSON.parse(fileContents)

  await db.transaction(async tx => {
    await tx.delete(shipTable)
    await tx.delete(cruiseLineTable)

    for (const cruiseLine of cruiseData.cruiseLines || []) {
      const insertedCruiseLines = await tx
        .insert(cruiseLineTable)
        .values({
          name: cruiseLine.name,
          country: cruiseLine.country,
          website: cruiseLine.website
        })
        .returning({ id: cruiseLineTable.id })

      const cruiseLineId = insertedCruiseLines[0].id

      for (const ship of cruiseLine.ships || []) {
        await tx.insert(shipTable).values({
          name: ship.name,
          cruiseLineId
        })
      }
    }
  })

  console.log('Cruise seed data reset from data/cruise.json')
}

module.exports = loadCruiseData
