const {
  buildDeploymentReadiness,
  buildDeploymentTargets,
  buildEnvironmentGate,
  buildPlatformTargetGate,
  buildQualityReleaseGate,
  buildReleaseEvidence,
  getStatusForScore
} = require('../../services/deploymentReadiness.service')

describe('deployment readiness service', () => {
  const packageJson = {
    scripts: {
      'start:prod': 'npm run react:build && node index.js',
      'react:build': 'vite build --config frontend/react/vite.config.js',
      'test:all': 'npm run test:inventory:audit && npm run react:production:complete && npm run jest:coverage:all && npm run browserTests:react && npm run perf:smoke:local && npm run lighthouse:ci:local',
      'browserTests:react': 'npm run uiTests:react && npm run playwright:mobile:react && npm run playwright:responsive:react',
      'perf:smoke:local': 'start-server-and-test start http://localhost:8000 perf:smoke',
      'lighthouse:ci:local': 'npm run react:build && start-server-and-test start http://localhost:8000/health lighthouse:ci',
      'release:source:audit': 'node scripts/verify-source-package.js',
      'production:deployment:audit': 'node scripts/verify-production-deployment.js',
      'db:test:ready': 'docker compose up -d && node scripts/wait-for-test-db.js'
    },
    dependencies: {
      pg: '^8.20.0',
      'drizzle-orm': '^0.45.2'
    }
  }

  const files = {
    'render.yaml': true,
    'docker-compose.yml': true,
    'drizzle.config.js': true,
    'lhci-report': true
  }

  it('builds deployment readiness gates, launch sequence, targets, and evidence', () => {
    const readiness = buildDeploymentReadiness({
      packageJson,
      files,
      env: { NODE_ENV: 'production' },
      renderConfig: 'startCommand: npm run start:prod\nhealthCheckPath: /health\nenvVars:\n  - key: DATABASE_URL\n  - key: NODE_ENV\n',
      dockerCompose: 'postgres:5432',
      readme: 'Cruise Fleet Operations Platform turnaround operations deployment environment lighthouse architecture operations verification runbook DATABASE_URL PORT NODE_ENV'
    })

    expect(readiness.title).toBe('Deployment Readiness Center')
    expect(readiness.overallScore).toBeGreaterThanOrEqual(80)
    expect(readiness.gates.map(gate => gate.id)).toEqual([
      'platform-target',
      'environment',
      'database',
      'quality-release',
      'operational-release-documentation'
    ])
    expect(readiness.launchPlan).toHaveLength(5)
    expect(readiness.deploymentTargets.map(target => target.id)).toContain('render')
    expect(readiness.releaseEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Full regression gate', value: 'Scripted' })
    ]))
  })

  it('surfaces gaps when platform and environment readiness are incomplete', () => {
    const readiness = buildDeploymentReadiness({ packageJson: { scripts: {} }, files: {}, readme: '' })

    expect(readiness.status).toBe('needs-work')
    expect(readiness.summary).toContain('production release blocker')
    expect(readiness.gates.some(gate => gate.status === 'needs-work')).toBe(true)
    expect(readiness.launchPlan[0]).toEqual(expect.objectContaining({ sequence: 1 }))
    expect(readiness.launchPlan[0].action).not.toContain('before launch')
  })

  it('scores platform, environment, and quality gates independently', () => {
    expect(getStatusForScore(95)).toBe('ready')
    expect(getStatusForScore(70)).toBe('watch')
    expect(getStatusForScore(30)).toBe('needs-work')

    const platformGate = buildPlatformTargetGate({ files, packageJson, renderConfig: 'startCommand: npm run start:prod healthCheckPath: /health' })
    const environmentGate = buildEnvironmentGate({ files: {}, env: {}, renderConfig: '', readme: '' })
    const qualityGate = buildQualityReleaseGate({ packageJson, files: {} })

    expect(platformGate.status).toBe('ready')
    expect(environmentGate.status).toBe('needs-work')
    expect(qualityGate.status).toBe('ready')
  })

  it('identifies deployment target candidates and release evidence', () => {
    const targets = buildDeploymentTargets({ files: { 'render.yaml': true }, renderConfig: 'healthCheckPath: /health' })
    const evidence = buildReleaseEvidence({ packageJson, files: { 'render.yaml': true } })

    expect(targets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'render', status: 'configured' }),
      expect.objectContaining({ id: 'railway', status: 'candidate' }),
      expect.objectContaining({ id: 'fly', status: 'candidate' })
    ]))
    expect(evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Deployment config', value: 'Present' })
    ]))
  })
})
