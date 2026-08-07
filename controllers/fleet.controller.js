const cruiseLineManagementController = require('./cruiseLineManagement.controller')
const shipManagementController = require('./shipManagement.controller')

module.exports = {
  ...cruiseLineManagementController,
  ...shipManagementController
}
