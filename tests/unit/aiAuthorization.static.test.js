const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '../..')
const routes = fs.readFileSync(path.join(projectRoot, 'routes/ai.routes.js'), 'utf8')
const briefingController = fs.readFileSync(path.join(projectRoot, 'controllers/aiBriefing.controller.js'), 'utf8')
const turnaroundScope = fs.readFileSync(path.join(projectRoot, 'services/turnaroundScope.service.js'), 'utf8')

describe('AI production authorization contracts', () => {
  it('protects platform-wide AI status and evaluation surfaces with global-admin authorization', () => {
    for (const route of [
      "router.get('/program-status', requireGlobalAdminAccess",
      "router.get('/ci-evidence/summary', requireGlobalAdminAccess",
      "router.get('/adversarial/quality-summary', requireGlobalAdminAccess",
      "router.get('/evaluations/turnaround-briefing/quality-summary', requireGlobalAdminAccess",
      "router.post('/evaluations/turnaround-briefing/release-policy/preview', requireGlobalAdminAccess",
      "router.get('/evaluations/turnaround-briefing/runs', requireGlobalAdminAccess",
      "router.get('/evaluations/turnaround-briefing/runs/:runId/compare', requireGlobalAdminAccess",
      "router.post('/evaluations/turnaround-briefing/matrix', requireGlobalAdminAccess",
      "router.post('/evaluations/turnaround-briefing/runs', requireGlobalAdminAccess",
      "router.post('/turnaround-briefing', requireGlobalAdminAccess"
    ]) expect(routes).toContain(route)
  })

  it('binds operational AI history, review, and generation to server-side turnaround scope', () => {
    expect(routes).toContain("router.get('/turnaround-operations/:operationId/briefings', requireTurnaroundOperationReadAccess('operationId')")
    expect(routes).toContain("router.post('/turnaround-operations/:operationId/briefings/:briefingId/review', requireTurnaroundOperationReadAccess('operationId')")
    expect(routes).toContain("router.post('/turnaround-operations/:operationId/briefing', requireTurnaroundOperationReadAccess('operationId')")
    expect(turnaroundScope).toContain('if (getAuthenticationMode() === AUTH_MODES.JWT)')
    expect(turnaroundScope).toContain('return canAccessOperationScope(req, operation.id)')
  })

  it('uses the server-generated request correlation id for AI audit and telemetry', () => {
    expect(briefingController).toContain('requestId: req.requestId || null')
    expect(briefingController).not.toContain("req.get('X-Request-Id')")
  })
})
