const aiStatusController = require('./aiStatus.controller')
const aiBriefingController = require('./aiBriefing.controller')
const aiEvaluationController = require('./aiEvaluation.controller')
const aiControllerSupport = require('./aiControllerSupport')

module.exports = {
  ...aiStatusController,
  ...aiBriefingController,
  ...aiEvaluationController,
  ...aiControllerSupport
}
