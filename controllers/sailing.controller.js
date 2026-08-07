const sailingManagementController = require('./sailingManagement.controller')
const itineraryQueryController = require('./itineraryQuery.controller')
const itineraryManagementController = require('./itineraryManagement.controller')

module.exports = {
  ...sailingManagementController,
  ...itineraryQueryController,
  ...itineraryManagementController
}
