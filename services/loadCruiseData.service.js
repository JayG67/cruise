const fs = require('fs')
const path = require('path')

const db = require('../db')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')

async function loadCruiseData() {
  let cruiseLineCount = 0
  let shipCount = 0
  let sailingCount = 0
  let itineraryDayCount = 0
  let activityCount = 0

  const filePath = path.join(__dirname, '..', 'data', 'cruise.json')
  const fileContents = fs.readFileSync(filePath, 'utf-8')
  const cruiseData = JSON.parse(fileContents)

  await db.transaction(async tx => {
    await tx.delete(activityScheduleTable)
    await tx.delete(itineraryDayTable)
    await tx.delete(sailingTable)
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
      cruiseLineCount += 1

      for (const ship of cruiseLine.ships || []) {
        const insertedShips = await tx
          .insert(shipTable)
          .values({
            name: ship.name,
            currentPort: ship.currentPort,
            cruiseLineId
          })
          .returning({ id: shipTable.id })

        const shipId = insertedShips[0].id
        shipCount += 1

        for (const sailing of ship.sailings || []) {
          const insertedSailings = await tx
            .insert(sailingTable)
            .values({
              shipId,
              departureDate: sailing.departureDate,
              port: sailing.port || sailing.departurePort,
              departurePort: sailing.departurePort || sailing.port,
              arrivalPort: sailing.arrivalPort || sailing.port,
              days: sailing.days,
              isRepositioning: Boolean(sailing.isRepositioning)
            })
            .returning({ id: sailingTable.id })

          const sailingId = insertedSailings[0].id
          sailingCount += 1

          for (const itineraryDay of sailing.itinerary || []) {
            const insertedItineraryDays = await tx
              .insert(itineraryDayTable)
              .values({
                sailingId,
                day: itineraryDay.day,
                title: itineraryDay.title,
                port: itineraryDay.port
              })
              .returning({ id: itineraryDayTable.id })

            const itineraryDayId = insertedItineraryDays[0].id
            itineraryDayCount += 1

            for (const activity of itineraryDay.activitySchedule || []) {
              await tx.insert(activityScheduleTable).values({
                itineraryDayId,
                time: activity.time,
                activity: activity.activity
              })
              activityCount += 1
            }
          }
        }
      }
    }
  })

  if (process.env.NODE_ENV !== 'test') {
    console.log('Cruise seed data reset from data/cruise.json')
  }

  return {
    cruiseLineCount,
    shipCount,
    sailingCount,
    itineraryDayCount,
    activityCount,
    source: 'data/cruise.json'
  }
}

module.exports = loadCruiseData
