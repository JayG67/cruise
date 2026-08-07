const customerManagementController = require('./customerManagement.controller')
const passengerExperienceController = require('./passengerExperience.controller')

module.exports = {
  ...customerManagementController,
  ...passengerExperienceController
}
