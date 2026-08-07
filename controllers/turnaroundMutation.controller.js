const { createTurnaroundCommandController } = require('./turnaroundCommand.controller')
const { createTurnaroundEscalationController } = require('./turnaroundEscalation.controller')
const { createTurnaroundWorkforceController } = require('./turnaroundWorkforce.controller')
const { createTurnaroundTaskController } = require('./turnaroundTask.controller')

function createTurnaroundMutationController({ getTurnaroundOperationDetails }) {
  if (typeof getTurnaroundOperationDetails !== 'function') {
    throw new TypeError('getTurnaroundOperationDetails is required')
  }

  const dependencies = { getTurnaroundOperationDetails }

  return {
    ...createTurnaroundCommandController(dependencies),
    ...createTurnaroundEscalationController(dependencies),
    ...createTurnaroundWorkforceController(dependencies),
    ...createTurnaroundTaskController(dependencies)
  }
}

module.exports = { createTurnaroundMutationController }
