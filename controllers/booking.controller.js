const bookingManagementController = require('./bookingManagement.controller')
const bookingPassengerController = require('./bookingPassenger.controller')

module.exports = {
  ...bookingManagementController,
  ...bookingPassengerController
}
