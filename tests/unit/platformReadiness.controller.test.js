jest.mock('../../db', () => ({ select: jest.fn() }))
jest.mock('../../services/dataArchitectureReadiness.service', () => ({ buildDataArchitectureReadiness: jest.fn(() => ({ data: true })) }))
jest.mock('../../services/productionHardeningReadiness.service', () => ({ buildProductionHardeningReadiness: jest.fn(() => ({ hardening: true })) }))
jest.mock('../../services/deploymentReadiness.service', () => ({ buildDeploymentReadiness: jest.fn(() => ({ deployment: true })) }))
jest.mock('../../services/publicLaunchReadiness.service', () => ({ buildPublicLaunchReadiness: jest.fn(input => ({ launch: true, ...input })) }))
jest.mock('../../services/requestAuthorization.service', () => ({ requireAdminRequest: jest.fn() }))

const db = require('../../db')
const { buildDataArchitectureReadiness } = require('../../services/dataArchitectureReadiness.service')
const { buildProductionHardeningReadiness } = require('../../services/productionHardeningReadiness.service')
const { buildDeploymentReadiness } = require('../../services/deploymentReadiness.service')
const { buildPublicLaunchReadiness } = require('../../services/publicLaunchReadiness.service')
const { requireAdminRequest } = require('../../services/requestAuthorization.service')
const controller = require('../../controllers/platformReadiness.controller')

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
}

function queueEmptyDatabaseReads() {
  db.select.mockImplementation(() => ({ from: jest.fn().mockResolvedValue([]) }))
}

describe('platformReadiness controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireAdminRequest.mockResolvedValue(true)
    queueEmptyDatabaseReads()
  })

  it.each([
    ['getDeploymentReadiness', buildDeploymentReadiness, { deployment: true }],
    ['getProductionHardeningReadiness', buildProductionHardeningReadiness, { hardening: true }]
  ])('returns %s readiness for authorized administrators', async (handler, builder, expected) => {
    const res = response()
    await controller[handler]({}, res, jest.fn())
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(expected)
    expect(builder).toHaveBeenCalledTimes(1)
  })

  it('builds data architecture readiness from all platform datasets', async () => {
    const res = response()
    await controller.getDataArchitectureReadiness({}, res, jest.fn())
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ data: true })
    expect(db.select).toHaveBeenCalledTimes(16)
    expect(buildDataArchitectureReadiness).toHaveBeenCalledWith(expect.objectContaining({
      cruiseLines: [], ships: [], sailings: [], customers: [], bookings: [], auditEvents: []
    }))
  })

  it('builds public-launch readiness from data, hardening, and deployment evidence', async () => {
    const res = response()
    await controller.getPublicLaunchReadiness({}, res, jest.fn())
    expect(res.statusCode).toBe(200)
    expect(db.select).toHaveBeenCalledTimes(16)
    expect(buildPublicLaunchReadiness).toHaveBeenCalledWith({
      dataArchitecture: { data: true },
      productionHardening: { hardening: true },
      deployment: { deployment: true }
    })
  })

  it('short-circuits readiness endpoints when authorization fails', async () => {
    requireAdminRequest.mockResolvedValue(false)
    await controller.getDeploymentReadiness({}, response(), jest.fn())
    expect(buildDeploymentReadiness).not.toHaveBeenCalled()
  })


  it('reads deployment evidence from the canonical case-sensitive README.md path', async () => {
    const fs = require('fs')
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(filePath => {
      const value = String(filePath)
      if (value.endsWith('/package.json')) return '{}'
      if (value.endsWith('/README.md')) return 'canonical-readme-evidence'
      return ''
    })

    try {
      await controller.getDeploymentReadiness({}, response(), jest.fn())
      expect(buildDeploymentReadiness).toHaveBeenCalledWith(expect.objectContaining({
        readme: 'canonical-readme-evidence'
      }))
      expect(readSpy.mock.calls.some(([filePath]) => String(filePath).endsWith('/Readme.md'))).toBe(false)
    } finally {
      readSpy.mockRestore()
    }
  })

  it.each([
    'getPublicLaunchReadiness',
    'getDeploymentReadiness',
    'getProductionHardeningReadiness',
    'getDataArchitectureReadiness'
  ])('short-circuits %s before file or database evidence is collected when authorization fails', async handler => {
    requireAdminRequest.mockResolvedValue(false)
    await controller[handler]({}, response(), jest.fn())
    expect(db.select).not.toHaveBeenCalled()
    expect(buildPublicLaunchReadiness).not.toHaveBeenCalled()
    expect(buildDeploymentReadiness).not.toHaveBeenCalled()
    expect(buildProductionHardeningReadiness).not.toHaveBeenCalled()
    expect(buildDataArchitectureReadiness).not.toHaveBeenCalled()
  })

  it('forwards readiness failures to Express error handling', async () => {
    buildDeploymentReadiness.mockImplementationOnce(() => { throw new Error('readiness failed') })
    const next = jest.fn()
    await controller.getDeploymentReadiness({}, response(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'readiness failed' }))

    db.select.mockImplementationOnce(() => { throw new Error('database failed') })
    const dataNext = jest.fn()
    await controller.getDataArchitectureReadiness({}, response(), dataNext)
    expect(dataNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'database failed' }))
  })
})
