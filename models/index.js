const cruiseLineTable = require('./cruiseline.model')
const shipTable = require('./ship.model')
const sailingTable = require('./sailing.model')
const itineraryDayTable = require('./itineraryDay.model')
const activityScheduleTable = require('./activitySchedule.model')
const customerTable = require('./customer.model')
const bookingTable = require('./booking.model')
const bookingPassengerTable = require('./bookingPassenger.model')
const demoUserTable = require('./demoUser.model')
const customerItineraryFavoriteTable = require('./customerItineraryFavorite.model')
const turnaroundOperationTable = require('./turnaroundOperation.model')
const turnaroundTaskTable = require('./turnaroundTask.model')

module.exports = {
  cruiseLineTable,
  shipTable,
  sailingTable,
  itineraryDayTable,
  activityScheduleTable,
  customerTable,
  bookingTable,
  bookingPassengerTable,
  demoUserTable,
  customerItineraryFavoriteTable,
  turnaroundOperationTable,
  turnaroundTaskTable
}
