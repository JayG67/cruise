const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('operational dashboard utility ownership', () => {
  it('keeps the public utility module as a stable facade', () => {
    const facade = read('frontend/react/src/components/operations/operationalDashboardUtils.js')

    expect(facade).toContain("export * from './operationalDashboardLabels.js'")
    expect(facade).toContain("export * from './operationalDashboardReadiness.js'")
    expect(facade).toContain("export * from './operationalDashboardFormatting.js'")
    expect(facade).not.toContain('function buildOperationalDirectory')
    expect(facade).not.toContain('function formatAuditEventType')
  })

  it('separates labels, readiness modeling, and timeline formatting', () => {
    const labels = read('frontend/react/src/components/operations/operationalDashboardLabels.js')
    const readiness = read('frontend/react/src/components/operations/operationalDashboardReadiness.js')
    const formatting = read('frontend/react/src/components/operations/operationalDashboardFormatting.js')

    expect(labels).toContain('export const OPERATIONAL_DIRECTORY_ROLES')
    expect(labels).toContain('export function getReleasePacketStatusLabel')
    expect(readiness).toContain('export function buildOperationalDirectory')
    expect(readiness).toContain('export function getOperationReleaseMetrics')
    expect(readiness).toContain('export function buildRoleOperationsBrief')
    expect(formatting).toContain('export function formatAuditEventType')
    expect(formatting).toContain('export function formatOperationalTimelineTime')
    expect(formatting).toContain('export function getOperationalTimelineTone')
  })
})
