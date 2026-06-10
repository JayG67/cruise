const cruiseLineTable = require('./cruiseline.model')
const shipTable = require('./ship.model')
const sailingTable = require('./sailing.model')
const itineraryDayTable = require('./itineraryDay.model')
const activityScheduleTable = require('./activitySchedule.model')
const customerTable = require('./customer.model')
const bookingTable = require('./booking.model')
const bookingPassengerTable = require('./bookingPassenger.model')
const demoUserTable = require('./demoUser.model')
const appUserTable = require('./appUser.model')
const appRoleTable = require('./appRole.model')
const appUserRoleTable = require('./appUserRole.model')
const customerItineraryFavoriteTable = require('./customerItineraryFavorite.model')
const turnaroundOperationTable = require('./turnaroundOperation.model')
const turnaroundTaskTable = require('./turnaroundTask.model')
const turnaroundTaskUpdateTable = require('./turnaroundTaskUpdate.model')
const turnaroundSignoffTable = require('./turnaroundSignoff.model')
const turnaroundEscalationTable = require('./turnaroundEscalation.model')
const turnaroundStaffingTable = require('./turnaroundStaffing.model')
const turnaroundTaskDependencyTable = require('./turnaroundTaskDependency.model')
const turnaroundHandoffTable = require('./turnaroundHandoff.model')
const auditEventTable = require('./auditEvent.model')

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
  appUserTable,
  appRoleTable,
  appUserRoleTable,
  customerItineraryFavoriteTable,
  turnaroundOperationTable,
  turnaroundTaskTable,
  turnaroundTaskUpdateTable,
  turnaroundSignoffTable,
  turnaroundEscalationTable,
  turnaroundStaffingTable,
  turnaroundTaskDependencyTable,
  turnaroundHandoffTable,
  auditEventTable
}
