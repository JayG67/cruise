const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const customerItineraryFavoriteTable = require('../models/customerItineraryFavorite.model')
const db = require('../db')
const { eq } = require('drizzle-orm')

async function getCustomerFavoriteActivityIds(customerId) {
  if (!customerId) return new Set()

  const rows = await db
    .select()
    .from(customerItineraryFavoriteTable)
    .where(eq(customerItineraryFavoriteTable.customerId, customerId))

  return new Set(rows.map(row => row.activityScheduleId))
}

exports.getItineraryBySailing = async (req, res, next) => {
  try {
    const { sailingId } = req.params
    const { customerId, favoritesOnly } = req.query
    const itineraryDays = await db.select().from(itineraryDayTable).where(eq(itineraryDayTable.sailingId, sailingId))

    if (!itineraryDays || itineraryDays.length === 0) {
      return res.status(404).json({ message: 'No itinerary found for the specified sailing' })
    }

    const favoriteIds = await getCustomerFavoriteActivityIds(customerId)
    const itineraryWithActivities = []

    for (const itineraryDay of itineraryDays.sort((left, right) => left.day - right.day)) {
      const activitySchedule = await db
        .select()
        .from(activityScheduleTable)
        .where(eq(activityScheduleTable.itineraryDayId, itineraryDay.id))

      const decoratedActivities = activitySchedule.map(activity => ({
        ...activity,
        isFavorite: favoriteIds.has(activity.id)
      }))
      const visibleActivities = favoritesOnly === 'true'
        ? decoratedActivities.filter(activity => activity.isFavorite)
        : decoratedActivities

      if (favoritesOnly === 'true' && visibleActivities.length === 0) continue
      itineraryWithActivities.push({ ...itineraryDay, activitySchedule: visibleActivities })
    }

    if (!itineraryWithActivities.length) {
      return res.status(404).json({ message: 'No itinerary found for the specified sailing' })
    }

    return res.status(200).json(itineraryWithActivities)
  } catch (error) {
    next(error)
  }
}

