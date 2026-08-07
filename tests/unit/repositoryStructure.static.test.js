const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('repository structure guardrails', () => {
  it('provides one safe repair command for misplaced source and generated artifacts', () => {
    const packageJson = JSON.parse(read('package.json'))
    const repairScript = read('scripts/repair-repository-structure.js')

    expect(packageJson.scripts['repo:repair']).toBe(
      'node scripts/repair-repository-structure.js && npm run clean:generated'
    )
    expect(packageJson.description).toBe(
      'Enterprise cruise fleet operations platform for voyage administration, turnaround coordination, passenger services, and operational assurance'
    )
    expect(repairScript).toContain('obsoleteStandaloneFiles')
    expect(repairScript).toContain("'.github/package.json'")
    expect(repairScript).toContain("'playwright/support/initializeDatabase.service.js'")
    expect(repairScript).toContain("'frontend/react/src/components/fleet/ReactFleetShipSailingPanel.jsx'")
    expect(repairScript).toContain("'sql/remove-leftover-created-cruise-lines.sql'")
    expect(repairScript).toContain("'scripts/print-db-connection.js'")
    expect(repairScript).toContain("'frontend/react/src/components/ReactDeploymentReadinessCenter.jsx'")
    expect(repairScript).toContain("'frontend/react/src/components/ReactProductionHardeningCenter.jsx'")
    expect(repairScript).toContain("'frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx'")
    expect(repairScript).toContain("'frontend/react/src/components/ReactPublicLaunchControlCenter.jsx'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/readiness-deployment.css'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/readiness-production-hardening.css'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/readiness-data-architecture.css'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/readiness-public-launch.css'")
    expect(repairScript).toContain("'frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/operations-evidence-production-readiness.css'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/operations-evidence-operational-release-dossier.css'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/operations-evidence-reviewer-packet.css'")
    expect(repairScript).toContain("'frontend/react/src/styles/components/operations-continuity-reviewer.css'")
    expect(repairScript).toContain("'tests/unit/operationalLanguage.static.test.js'")
    expect(repairScript).toContain("'tests/unit/cruiseLinePresentationSuite.static.test.js'")
    expect(repairScript).toContain("'frontend/react/src/components/ReactCruiseLinePresentationSuite.jsx'")
    expect(repairScript).toContain("'frontend/react/src/domain/cruiseLinePresentation.js'")
    expect(repairScript).toContain('obsoleteMisplacedFiles')
    expect(repairScript).toContain('canonical source is missing')
    expect(repairScript).toContain("frontend/react/src/components/passenger/RoleBookingCard.jsx")
    expect(repairScript).toContain("frontend/react/src/components/passenger/RoleBookingList.jsx")
    expect(repairScript).toContain("frontend/react/src/components/passenger/RolePassengerSurface.jsx")
  })

  it('prevents non-CSS source from being tracked under the React styles tree', () => {
    const hygieneScript = read('scripts/verify-repo-hygiene.js')

    expect(hygieneScript).toContain("['.github/package.json'")
    expect(hygieneScript).toContain("['playwright/support/initializeDatabase.service.js'")
    expect(hygieneScript).toContain("['frontend/react/src/components/fleet/ReactFleetShipSailingPanel.jsx'")
    expect(hygieneScript).toContain("['sql/remove-leftover-created-cruise-lines.sql'")
    expect(hygieneScript).toContain("['scripts/print-db-connection.js'")
    expect(hygieneScript).toContain("['frontend/react/src/components/ReactDeploymentReadinessCenter.jsx'")
    expect(hygieneScript).toContain("['frontend/react/src/components/ReactProductionHardeningCenter.jsx'")
    expect(hygieneScript).toContain("['frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx'")
    expect(hygieneScript).toContain("['frontend/react/src/components/ReactPublicLaunchControlCenter.jsx'")
    expect(hygieneScript).toContain("['frontend/react/src/styles/components/readiness-deployment.css'")
    expect(hygieneScript).toContain("['frontend/react/src/styles/components/readiness-production-hardening.css'")
    expect(hygieneScript).toContain("['frontend/react/src/styles/components/readiness-data-architecture.css'")
    expect(hygieneScript).toContain("['frontend/react/src/styles/components/readiness-public-launch.css'")
    expect(hygieneScript).toContain("['frontend/react/src/components/operations/OperationsDormantReadinessPanels.jsx'")
    expect(hygieneScript).toContain("['frontend/react/src/styles/components/operations-evidence-production-readiness.css'")
    expect(hygieneScript).toContain("['frontend/react/src/styles/components/operations-evidence-operational-release-dossier.css'")
    expect(hygieneScript).toContain("['frontend/react/src/styles/components/operations-evidence-reviewer-packet.css'")
    expect(hygieneScript).toContain("['frontend/react/src/styles/components/operations-continuity-reviewer.css'")
    expect(hygieneScript).toContain("['tests/unit/operationalLanguage.static.test.js'")
    expect(hygieneScript).toContain("['tests/unit/cruiseLinePresentationSuite.static.test.js'")
    expect(hygieneScript).toContain("root: 'frontend/react/src/styles/'")
    expect(hygieneScript).toContain("allowedExtensions: new Set(['.css'])")
    expect(hygieneScript).toContain('Tracked source files violate repository directory conventions')
  })
})
