const platformReadinessController = require('./platformReadiness.controller')
const platformOperationsAdminController = require('./platformOperationsAdmin.controller')

module.exports = {
  ...platformReadinessController,
  ...platformOperationsAdminController
}
