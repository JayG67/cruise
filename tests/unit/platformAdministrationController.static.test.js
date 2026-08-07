const fs = require('fs')
const path = require('path')
const { expectControllerDelegated } = require('./controllerFacadeTestHelpers')

const projectRoot = path.resolve(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

const handlers = [
  'getPublicLaunchReadiness',
  'getDeploymentReadiness',
  'getProductionHardeningReadiness',
  'getDataArchitectureReadiness',
  'getTurnaroundAdminSetup',
  'createTurnaroundPerson',
  'updateTurnaroundPerson',
  'deleteTurnaroundPerson',
  'getPlatformAuditEvents'
]

describe('platform administration controller decomposition contracts', () => {
  it('owns platform administration and readiness handlers outside the legacy controller', () => {
    const legacyController = read('controllers/cruise.controller.js')
    const platformController = [
      read('controllers/platformReadiness.controller.js'),
      read('controllers/platformOperationsAdmin.controller.js')
    ].join('\n')

    handlers.forEach(handler => {
      expect(platformController).toContain(`exports.${handler}`)
      expect(legacyController).not.toContain(`exports.${handler}`)
    })
  })

  it('is explicitly delegated through the compatibility facade', () => {
    expectControllerDelegated(
      read('controllers/cruise.controller.js'),
      'platformAdministrationController',
      './platformAdministration.controller'
    )
  })

  it('preserves authorization, audit, and readiness contracts', () => {
    const controller = [
      read('controllers/platformReadiness.controller.js'),
      read('controllers/platformOperationsAdmin.controller.js')
    ].join('\n')
    expect(controller).toContain('requireAdminRequest')
    expect(controller).toContain("eventType: 'TURNAROUND_PERSON_CREATED'")
    expect(controller).toContain('buildDataArchitectureReadiness({')
    expect(controller).toContain('buildPublicLaunchReadiness({')
    expect(controller).toContain('buildAuditEventListResponse')
  })
})
