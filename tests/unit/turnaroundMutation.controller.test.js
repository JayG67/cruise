jest.mock('../../controllers/turnaroundCommand.controller', () => ({ createTurnaroundCommandController: jest.fn(() => ({ command: jest.fn() })) }))
jest.mock('../../controllers/turnaroundEscalation.controller', () => ({ createTurnaroundEscalationController: jest.fn(() => ({ escalation: jest.fn() })) }))
jest.mock('../../controllers/turnaroundWorkforce.controller', () => ({ createTurnaroundWorkforceController: jest.fn(() => ({ workforce: jest.fn() })) }))
jest.mock('../../controllers/turnaroundTask.controller', () => ({ createTurnaroundTaskController: jest.fn(() => ({ task: jest.fn() })) }))

const { createTurnaroundMutationController } = require('../../controllers/turnaroundMutation.controller')
const command = require('../../controllers/turnaroundCommand.controller')
const escalation = require('../../controllers/turnaroundEscalation.controller')
const workforce = require('../../controllers/turnaroundWorkforce.controller')
const task = require('../../controllers/turnaroundTask.controller')

describe('turnaroundMutation controller', () => {
  beforeEach(() => jest.clearAllMocks())

  it('requires the shared operation-details dependency', () => {
    expect(() => createTurnaroundMutationController({})).toThrow(TypeError)
    expect(() => createTurnaroundMutationController({ getTurnaroundOperationDetails: null })).toThrow('getTurnaroundOperationDetails is required')
  })

  it('composes all mutation controller surfaces with the same dependency', () => {
    const getTurnaroundOperationDetails = jest.fn()
    const controller = createTurnaroundMutationController({ getTurnaroundOperationDetails })

    expect(controller).toEqual(expect.objectContaining({ command: expect.any(Function), escalation: expect.any(Function), workforce: expect.any(Function), task: expect.any(Function) }))
    for (const factory of [command.createTurnaroundCommandController, escalation.createTurnaroundEscalationController, workforce.createTurnaroundWorkforceController, task.createTurnaroundTaskController]) {
      expect(factory).toHaveBeenCalledWith({ getTurnaroundOperationDetails })
    }
  })
})
