const fs = require('fs')
const path = require('path')
const RETIRED_APP_CSS_PATH = ['frontend/react/src/styles/app', 'css'].join('.')
const PROJECT_ROOT = path.resolve(__dirname, '../..')

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8')
}

function optionalStyleRead(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath)
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : ''
}

function readCssBundle(...relativePaths) {
  function readRecursive(relativePath, seen = new Set()) {
    const fullPath = path.join(PROJECT_ROOT, relativePath)
    if (seen.has(fullPath)) return ''
    seen.add(fullPath)

    const content = fs.readFileSync(fullPath, 'utf8')
    const directory = path.dirname(relativePath)

    return content.replace(/@import\s+['"](.+?)['"];?/g, (_match, importPath) => {
      const nestedPath = path.normalize(path.join(directory, importPath)).replace(/\\/g, '/')
      return readRecursive(nestedPath, seen)
    })
  }

  return relativePaths.map(relativePath => readRecursive(relativePath)).join('\n')
}

test('role selector finder panels use CSS foundation contrast contracts', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/role-selector.css')

  expect(cssSource).toContain('Role selector component architecture')
  expect(cssSource).toContain('Role selector finder panels now use the CSS foundation')
  expect(cssSource).toContain('.react-production-shell .role-selector-section .person-finder-panel')
  expect(cssSource).toContain('.react-production-shell .role-selector-section .selected-person-card')
  expect(cssSource).toContain('var(--ce-command-text)')
  expect(cssSource).toContain('var(--ce-data-text)')
})


test('operational role assignment filters use CSS foundation light editor contracts', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/role-selector.css')

  expect(cssSource).toContain('Passenger and operational finder component architecture')
  expect(cssSource).toContain('.react-production-shell .role-selector-section :is(.passenger-finder-panel, .person-finder-panel, .role-summary-card)')
  expect(cssSource).toContain('.react-production-shell .role-selector-section :is(.passenger-finder-grid, .operational-person-filter-grid)')
  expect(cssSource).toContain('.react-production-shell .role-selector-section .operational-person-filter-grid .role-selector-field')
  expect(cssSource).toContain('var(--ce-data-text)')
})


test('turnaround role dashboard panels use dark operational motif overrides', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 464 - dark operational role dashboard motif')
  expect(cssSource).toContain('.role-dashboard-section [class*="turnaround"][class*="panel"]')
  expect(cssSource).toContain('background: linear-gradient(135deg, #082334')
})

test('build 465 contrast correction exists', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 465 - role dashboard contrast correction')
})

test('build 466 operational dashboard contrast repair is present', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 466 - exact operational dashboard contrast repair')
  expect(cssSource).toContain('.react-role-dashboard .turnaround-fleet-board')
  expect(cssSource).toContain('.react-role-dashboard .operations-release-board')
  expect(cssSource).toContain('.react-role-dashboard .operations-lifecycle')
})

test('build 467 operational panels use explicit dark motif and light tile contrast', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 467 - operational role panels aligned to admin dark motif')
  expect(cssSource).toContain('.react-role-dashboard .turnaround-fleet-board')
  expect(cssSource).toContain('.react-role-dashboard .operations-release-board')
  expect(cssSource).toContain('.react-role-dashboard .operations-lifecycle')
})

test('build 468 operational role panels use role selector dark motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 468 - operational role panels use the same dark motif as the role selector')
  expect(cssSource).toContain('.react-role-dashboard .turnaround-fleet-heading')
  expect(cssSource).toContain('background: transparent !important')
})

test('build 469 restores white text on dark operational cards', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 469 - restore white text on dark operational cards')
})

test('build 470 fleet portfolio dark card text contrast is present', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 470 - exact fleet portfolio dark-card text contrast')
  expect(cssSource).toContain('.react-role-dashboard .turnaround-fleet-list > article > :not(dl)')
})

test('build 471 fixes exact selected turnaround portfolio card contrast', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 471 - exact selected turnaround portfolio-card contrast fix')
  expect(cssSource).toContain('button.turnaround-fleet-card > span:not(.turnaround-fleet-status)')
  expect(cssSource).toContain('button.turnaround-fleet-card > strong')
})

test('build 473 release-board cards match operational metric tile style', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')

  expect(cssSource).toContain('Build 473 - release-board KPI cards match operational metric tile style')
  expect(cssSource).toContain('.react-role-dashboard .operations-release-card')
  expect(cssSource).toContain('background: #f8fbff !important')
})

test('build 474 release board cards use white text on dark cards', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 474 - fix invisible release-board KPI text')
  expect(cssSource).toContain('-webkit-text-fill-color: #ffffff')
})

test('build 475 lifecycle story tiles use dark-card motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 475 - lifecycle story tiles match lifecycle dark-card motif')
  expect(cssSource).toContain('.react-role-dashboard .operations-lifecycle-story span')
})

test('build 476 role operations panels are unified to workspace selection style', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 476 - role-operations panels unified to workspace-selection style')
  expect(cssSource).toContain('.react-role-dashboard .operations-lifecycle-details > div')
  expect(cssSource).toContain('.react-role-dashboard .operations-release-packet')
})

test('retired reviewer packet detail styles remain deleted', () => {
  ;['operations-evidence-reviewer-packet.css', 'operations-continuity-reviewer.css'].forEach(file => {
    expect(readProjectFile('scripts/repair-repository-structure.js')).toContain(`'frontend/react/src/styles/components/${file}'`)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'frontend/react/src/styles/components', file))).toBe(false)
  })
})

test('build 478 outreach board details use readable card layout', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 478 - outreach board detail layout repair')
  expect(cssSource).toContain('.operations-operational-briefing-board-details')
  expect(cssSource).toContain('writing-mode: horizontal-tb')
})


test('employer-facing role dashboard does not render reviewer or system-readiness packet', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), 'utf8')

  expect(source).not.toContain('selectedOperation?.reviewerPacket')
  expect(source).not.toContain('react-operations-reviewer-packet')
  expect(source).not.toContain('Cruise-line reviewer packet')
  expect(source).not.toContain('Presentation-ready operational evidence packet')
  expect(source).not.toContain('reviewer readiness')
  expect(source).not.toContain('HOLD FOR COMMAND REVIEW')
})


test('employer-facing role dashboard does not render turnaround management status panel', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), 'utf8')

  expect(source).not.toContain('selectedOperation?.managementStatus')
  expect(source).not.toContain('react-operations-management-status')
  expect(source).not.toContain('Turnaround management status')
  expect(source).not.toContain('Production-demo completion map')
  expect(source).not.toContain('production-demo application')
  expect(source).not.toContain('NEEDS HARDENING')
})


test('employer-facing role dashboard does not render launch plan panel', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx'), 'utf8')

  expect(source).not.toContain('selectedOperation?.launchPlan')
  expect(source).not.toContain('react-operations-launch-plan')
  expect(source).not.toContain('Turnaround launch plan')
  expect(source).not.toContain('Reviewer demo certification gates')
})

test('build 482 scenario plan uses outreach-board dark motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 482 - scenario plan panel matches cruise-line outreach dark motif')
  expect(cssSource).toContain('.react-role-dashboard .operations-scenario-plan')
  expect(cssSource).toContain('.react-role-dashboard .operations-scenario-plan-details')
})

test('build 483 scenario stress cards use white text', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 483 - scenario stress cards force readable white text')
})

test('build 484 remaining role operation panels use dark outreach motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  expect(cssSource).toContain('Build 484 - unify remaining role-operations panels to the dark outreach-board motif')
  expect(cssSource).toContain('.react-role-dashboard .operations-command-center')
  expect(cssSource).toContain('.react-role-dashboard .operations-shift-briefing')
  expect(cssSource).toContain('.react-role-dashboard .operations-closeout-packet')
})

test('build 485 operations timeline uses executive brief dark motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-timeline.css', 'frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 485 - operations timeline and downstream panels match executive brief dark motif')
  expect(cssSource).toContain('[data-testid="react-operations-timeline"]')
})

test('build 486 role workspace lower panels use dark operational motif', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 486 - role workspace/detail panels match the approved dark motif')
  expect(cssSource).toContain('.operations-role-brief-panel')
  expect(cssSource).toContain('.operations-directory')
  expect(cssSource).toContain('.operations-handoff-detail-panel')
})

test('build 487 command detail workspace uses dark operational motif with readable text', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 487 - command detail workspace uses approved dark operational motif')
  expect(cssSource).toContain('.react-role-dashboard .operational-command-compatibility-panel .operational-readiness-card')
  expect(cssSource).toContain('-webkit-text-fill-color: #ffffff !important')
  expect(cssSource).toContain('.react-role-dashboard .operational-command-compatibility-panel .operational-command-form input')
})

test('build 488 command detail editor forms use dark cards with light editing controls', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 488 - command detail editor forms use dark operational cards while controls stay editable')
  expect(cssSource).toContain('.react-role-dashboard .operational-command-compatibility-panel .operational-command-form,')
  expect(cssSource).toContain('background: rgba(6, 30, 45, 0.88) !important')
  expect(cssSource).toContain('.react-role-dashboard .operational-command-compatibility-panel .operational-command-form input,')
  expect(cssSource).toContain('background: #ffffff !important')
  expect(cssSource).toContain('-webkit-text-fill-color: #0f172a !important')
})

test('build 489 deep operations workspace styling sweep keeps panels dark and controls editable', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css', 'frontend/react/src/styles/components/operations-queues.css', 'frontend/react/src/styles/components/operations-coverage.css')
  expect(cssSource).toContain('Build 489 - deep operations workspace styling sweep')
  expect(cssSource).toContain('.operations-dependency-workspace')
  expect(cssSource).toContain('.operations-handoff-workspace')
  expect(cssSource).toContain('.operations-staffing-workspace')
  expect(cssSource).toContain('.operations-escalation-workspace')
  expect(cssSource).toContain('.operations-readiness-workspace')
  expect(cssSource).toContain('background: rgba(6, 30, 45, 0.88) !important')
  expect(cssSource).toContain('color: #ffffff !important')
  expect(cssSource).toContain('-webkit-text-fill-color: #ffffff !important')
  expect(cssSource).toContain('background: #ffffff !important')
  expect(cssSource).toContain('-webkit-text-fill-color: #0f172a !important')
})




test('phase 23 first-impression hero styles live in the hero component layer', () => {
  const heroStyles = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/hero.css'), 'utf8')
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const legacyStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css', 'frontend/react/src/styles/components/product-polish.css')
  const foundationAudit = fs.readFileSync(path.join(__dirname, '../../scripts/verify-css-foundation.js'), 'utf8')
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')

  expect(componentIndex).toContain("@import './hero.css';")
  expect(heroStyles).toContain('CSS Foundation Refactor - Phase 23')
  expect(heroStyles).toContain('Build 358: first-impression landing page polish for cruise-line presentation')
  expect(heroStyles).toContain('.production-hero::before')
  expect(heroStyles).toContain('.hero-product-card')
  expect(heroStyles).toContain("url('/images/cruise-background-1280.webp')")
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 23')
  expect(designSystem).not.toContain('Build 358: first-impression landing page polish for cruise-line presentation')
  expect(designSystem).not.toContain('.hero-product-card')
  expect(legacyStyles).toContain('Phase 23 CSS retirement: first-impression landing page and production hero styles')
  expect(legacyStyles).not.toContain('Build 358: first-impression landing page polish for cruise-line presentation')
  expect(foundationAudit).toContain('assertNoTrailingFunctionalSelectorCommas')
  expect(foundationAudit).toContain('styles.hero')
})


test('phase 21 and 22 passenger voyage planner styles live in the passenger component layer', () => {
  const passengerStyles = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/passenger.css'), 'utf8')
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')

  expect(componentIndex).toContain("@import './passenger.css';")
  expect(passengerStyles).toContain('CSS Foundation Refactor - Phase 21')
  expect(passengerStyles).toContain('CSS Foundation Refactor - Phase 22')
  expect(passengerStyles).toContain('.passenger-voyage-planner')
  expect(passengerStyles).toContain('.voyage-planner-card')
  expect(passengerStyles).toContain('.voyage-booking-card')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 21')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 22')
})

test('phase 20 admin workspace styles live in component CSS', () => {
  const adminWorkspaces = readCssBundle(
    'frontend/react/src/styles/components/admin-workspaces.css',
    'frontend/react/src/styles/components/cruise-line-operations.css'
  )
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const legacyStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css', 'frontend/react/src/styles/components/product-polish.css')
  const appCss = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(componentIndex).toContain("@import './admin-workspaces.css';")
  expect(componentIndex).toContain("@import './cruise-line-operations.css';")
  expect(adminWorkspaces).toContain('CSS Foundation Refactor - Phase 20')
  expect(adminWorkspaces).toContain('Build 437: admin surface width and panel consistency repair')
  expect(adminWorkspaces).toContain('Build 448: lock starter ship controls until cruise line details are complete')
  expect(adminWorkspaces).toContain('Build 458 - hard contrast fix for SQA status and go-live readiness text')
  expect(adminWorkspaces).toContain('.react-create-workflow-section')
  expect(adminWorkspaces).toContain('.react-quality-section .go-live-readiness-panel .readiness-item')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 20')
  expect(designSystem).not.toContain('Build 437: admin surface width and panel consistency repair')
  expect(designSystem).not.toContain('Build 448: lock starter ship controls until cruise line details are complete')
  expect(legacyStyles).toContain('CSS Foundation Refactor Phase 20: Build 437-448 admin workspace')
  expect(legacyStyles).not.toContain('Build 437: admin surface width and panel consistency repair')
  expect(legacyStyles).not.toContain('Build 448: lock starter ship controls until cruise line details are complete')
  expect(appCss).not.toContain('Build 437: admin surface width and panel consistency repair')
})

test('phase 19 operational dashboard styles live in component CSS', () => {
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const operationsDashboard = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  const operationsTimeline = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/operations-timeline.css'), 'utf8')
  const operationsWorkspaces = readCssBundle('frontend/react/src/styles/components/operations-workspaces.css')
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')
  const legacyStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css', 'frontend/react/src/styles/components/product-polish.css')
  const appCss = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(componentIndex).toContain("@import './operations-role-surface.css';")
  expect(componentIndex).toContain("@import './operations-continuity.css';")
  expect(componentIndex).toContain("@import './operations-release.css';")
  expect(componentIndex).toContain("@import './operations-evidence.css';")
  expect(componentIndex).toContain("@import './operations-timeline.css';")
  expect(componentIndex).toContain("@import './operations-workspaces.css';")
  expect(componentIndex).toContain("@import './operations-queues.css';")
  expect(componentIndex).toContain("@import './operations-coverage.css';")
  expect(componentIndex).toContain("@import './readiness-centers.css';")
  expect(operationsDashboard).toContain('CSS Foundation Refactor - Phase 19')
  expect(operationsDashboard).toContain('Build 464 - dark operational role dashboard motif')
  expect(operationsDashboard).toContain('Build 484 - unify remaining role-operations panels to the dark outreach-board motif')
  expect(operationsTimeline).toContain('Build 485 - operations timeline and downstream panels match executive brief dark motif')
  expect(operationsWorkspaces).toContain('Build 489 - deep operations workspace styling sweep')
  expect(operationsWorkspaces).toContain('.operations-directory-panel')
  expect(operationsWorkspaces).toContain('.operational-command-compatibility-panel')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 20')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 19')
  expect(designSystem).not.toContain('Build 464 - dark operational role dashboard motif')
  expect(designSystem).not.toContain('Build 489 - deep operations workspace styling sweep')
  expect(legacyStyles).toContain('CSS Foundation Refactor Phase 19: Build 464-489 operational dashboard')
  expect(legacyStyles).not.toContain('Build 464 - dark operational role dashboard motif')
  expect(legacyStyles).not.toContain('Build 489 - deep operations workspace styling sweep')
  expect(appCss).not.toContain('Build 464 - dark operational role dashboard motif')
})


test('slice 31 retains live operational readiness styles without retired standalone workspace CSS', () => {
  const readinessCenters = readCssBundle('frontend/react/src/styles/components/readiness-centers.css')
  const operationsDashboard = readCssBundle('frontend/react/src/styles/components/operations-role-surface.css', 'frontend/react/src/styles/components/operations-continuity.css', 'frontend/react/src/styles/components/operations-release.css', 'frontend/react/src/styles/components/operations-evidence.css')
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')
  const legacyStyles = readCssBundle('frontend/react/src/styles/components/product-shell.css', 'frontend/react/src/styles/components/product-polish.css')
  const appCss = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(componentIndex).toContain("@import './readiness-centers.css';")
  expect(readinessCenters).toContain('Readiness centers aggregate.')
  expect(readinessCenters).not.toContain('.data-architecture-readiness-center')
  expect(readinessCenters).not.toContain('.production-hardening-center')
  expect(readinessCenters).not.toContain('.deployment-readiness-center')
  expect(readinessCenters).not.toContain('.portfolio-polish-center')
  expect(readinessCenters).not.toContain('.public-launch-control-center')
  expect(readinessCenters).toContain('.operations-control-board')
  expect(operationsDashboard).toContain('CSS Foundation Refactor Slice 31')
  expect(operationsDashboard).toContain('.operations-shift-briefing')
  expect(operationsDashboard).toContain('.operations-go-live-center')
  expect(operationsDashboard).toContain('.turnaround-team-readiness-card')
  expect(legacyStyles).toContain('CSS Foundation Refactor Slice 31: data architecture, hardening, deployment, portfolio, control-board, migration, and public launch readiness CSS moved to layered component CSS.')
  expect(appCss).not.toContain('.data-architecture-readiness-center')
  expect(appCss).not.toContain('.operations-go-live-center')
})

test('phase 18 retires the Build 490-495 operational contrast patch stack into the component layer', () => {
  const operationsContrastStyles = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/operations-contrast.css'), 'utf8')
  const componentIndex = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/index.css'), 'utf8')
  const retiredDesignSystemPath = path.join(__dirname, '../../frontend/react/src/styles/design-system.css')
  const designSystem = fs.existsSync(retiredDesignSystemPath) ? fs.readFileSync(retiredDesignSystemPath, 'utf8') : ''
  const legacyStyles = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(componentIndex).toContain("@import './operations-contrast.css';")
  expect(operationsContrastStyles).toContain('CSS Foundation Refactor - Phase 18')
  expect(operationsContrastStyles).toContain('Retires the Phase 18 Build 490-495 operational contrast patch stack')
  expect(operationsContrastStyles).toContain('.operational-command-compatibility-panel')
  expect(operationsContrastStyles).toContain('.operational-readiness-list')
  expect(operationsContrastStyles).toContain('.operations-dependency-workspace')
  expect(operationsContrastStyles).toContain('.operations-handoff-workspace')
  expect(operationsContrastStyles).toContain('.operations-staffing-workspace')
  expect(operationsContrastStyles).toContain('.operations-escalation-workspace')
  expect(operationsContrastStyles).toContain('.operations-readiness-workspace')
  expect(operationsContrastStyles).toContain('color: var(--ce-command-text) !important')
  expect(operationsContrastStyles).toContain('-webkit-text-fill-color: var(--ce-command-text) !important')
  expect(operationsContrastStyles).toContain('color: var(--ce-data-text) !important')
  expect(operationsContrastStyles).toContain('-webkit-text-fill-color: var(--ce-data-text) !important')
  expect(operationsContrastStyles).toContain('background: var(--ce-data-surface) !important')
  expect(operationsContrastStyles).toContain('background: #ffffff !important')
  expect(operationsContrastStyles).toContain('background: var(--ce-action-soft-bg) !important')
  expect(operationsContrastStyles).toContain(':is(input, select, textarea, option)')
  expect(designSystem).not.toContain('CSS Foundation Refactor - Phase 18')
  expect(legacyStyles).not.toContain('Build 490 - operational dark-surface text contrast sweep')
  expect(legacyStyles).not.toContain('Build 491 - hard stop for dark-on-dark operational command text')
  expect(legacyStyles).not.toContain('Build 492 - command workspace dark-surface text contrast hardening')
  expect(legacyStyles).not.toContain('Build 493 - readiness workspace dark text kill switch')
  expect(legacyStyles).not.toContain('Build 494 - command workspace contrast correction')
  expect(legacyStyles).not.toContain('Build 495 - nested light editor contrast correction')
})

test('role selector component keeps operational task action buttons on component-layer contrast rules', () => {
  const designSystem = readCssBundle('frontend/react/src/styles/components/role-selector.css')
  const legacyStyles = optionalStyleRead(RETIRED_APP_CSS_PATH)

  expect(designSystem).toContain('Operational form action component architecture')
  expect(designSystem).toContain('.operational-task-actions :is(button, .secondary-action-button, .compact-button)')
  expect(designSystem).toContain(':is(button.danger-outline-button, .danger-outline-button.compact-button)')
  expect(designSystem).toContain('background: var(--ce-action-soft-bg) !important')
  expect(designSystem).toContain('background: #fff1f2 !important')
  expect(designSystem).toContain('-webkit-text-fill-color: var(--ce-data-text) !important')
  expect(designSystem).toContain(':disabled')
  expect(legacyStyles).not.toContain('Build 496 - task status action buttons keep dark text on light pills')
})


test('quality console light surfaces cannot inherit the retired dark compatibility stack', () => {
  const consoleSource = [
    fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/AiQualityEvidenceWorkspace.jsx'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/QualityValidationWorkspace.jsx'), 'utf8')
  ].join('\n')
  const contrastContract = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/utilities/contrast-contract.css'), 'utf8')
  const legacyCompatibility = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/styles/components/admin-shell-legacy-compatibility.css'), 'utf8')

  expect(consoleSource).toContain('react-sqa-console ce-command-panel ce-surface-light')
  expect(consoleSource).toContain('react-sqa-status-pill ce-command-card ce-surface-light')
  expect(consoleSource).toContain('go-live-readiness-panel ce-surface-light')
  expect(consoleSource).toContain('react-sqa-action-card ce-command-card ce-surface-light')
  expect(contrastContract).toContain('Global readable typography contract.')
  expect(contrastContract).toContain('.react-quality-section')
  expect(contrastContract).toContain('.react-sqa-console.ce-surface-light')
  expect(contrastContract).toContain('color: var(--ce-contrast-light-text) !important;')
  expect(contrastContract).toContain('color: var(--ce-contrast-light-muted) !important;')
  expect(legacyCompatibility).not.toContain('.react-quality-section section h3,')
  expect(legacyCompatibility).not.toContain('.react-quality-section .react-sqa-action-card,')
})

test('keeps cruise-line presentation light cards readable and retires legacy white-text overrides', () => {
  const presentation = readProjectFile('frontend/react/src/components/ReactCruiseLineOperationsWorkspace.jsx')
  const contrastContract = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')
  const legacyCompatibility = readProjectFile('frontend/react/src/styles/components/admin-shell-legacy-compatibility.css')

  expect(presentation).toContain('presentation-hero-card ce-command-card ce-surface-light')
  expect(presentation).toContain('className="ce-surface-light"><span>Ships</span>')
  expect(presentation).toContain('className="ce-surface-light"><span>Ports</span>')
  expect(contrastContract).toContain('.presentation-hero-card.ce-surface-light')
  expect(contrastContract).toContain('.presentation-metric-grid article.ce-surface-light')
  expect(contrastContract).toContain(':is(h3, p, span, strong)')
  expect(legacyCompatibility).not.toContain('.cruise-line-presentation-suite .presentation-hero-card *')
  expect(legacyCompatibility).not.toContain('.cruise-line-presentation-suite article h3')
  expect(legacyCompatibility).not.toContain('.cruise-line-presentation-suite article p')

  const presentationLayout = readProjectFile('frontend/react/src/styles/components/cruise-line-operations-layout.css')
  expect(presentationLayout).toContain('.presentation-demo-flow.presentation-action-grid')
  expect(presentationLayout).toContain('display: grid !important;')
  expect(presentationLayout).toContain('row-gap: var(--ce-space-4, 1rem) !important;')
})

test('primary product display headings use the readable create-workflow tracking contract', () => {
  const cssSource = readCssBundle('frontend/react/src/styles/components/index.css')
  const fleetCss = readProjectFile('frontend/react/src/styles/components/admin-fleet.css')
  const turnaroundCss = readProjectFile('frontend/react/src/styles/components/admin-turnaround.css')

  expect(cssSource).toContain('Primary product headings use neutral tracking for readable display type')
  expect(cssSource).toContain('#react-app-title')
  expect(cssSource).toContain('#react-cruise-line-presentation-heading')
  expect(cssSource).toContain('#react-fleet-heading')
  expect(cssSource).toContain('#react-turnaround-admin-setup-heading')
  expect(cssSource).toContain('letter-spacing: 0 !important;')

  expect(fleetCss).toMatch(/fleet-directory-section h2#react-fleet-heading[\s\S]*?letter-spacing: 0 !important;/)
  expect(fleetCss).not.toMatch(/fleet-directory-section h2#react-fleet-heading[\s\S]*?letter-spacing: -0\.055em !important;/)
  expect(turnaroundCss).toMatch(/turnaround-admin-setup-panel h2#react-turnaround-admin-setup-heading[\s\S]*?letter-spacing: 0 !important;/)
  expect(turnaroundCss).not.toMatch(/turnaround-admin-setup-panel h2#react-turnaround-admin-setup-heading[\s\S]*?letter-spacing: -0\.055em !important;/)
})

test('administrator home workspaces share one wide presentation rail and outer panel treatment', () => {
  const componentIndex = readProjectFile('frontend/react/src/styles/components/index.css')
  const shellTokens = readProjectFile('frontend/react/src/styles/components/admin-shell-tokens.css')
  const layoutCss = readProjectFile('frontend/react/src/styles/components/admin-home-layout-consistency.css')

  expect(componentIndex).toContain("@import './admin-home-layout-consistency.css';")
  expect(shellTokens).toContain('--admin-rail-width: 1440px;')
  expect(layoutCss).toContain('--admin-home-rail-width: 1440px;')
  expect(layoutCss).toContain('.platform-workspace-navigator')
  expect(layoutCss).toContain('.role-selector-section')
  expect(layoutCss).toContain('.route-panel')
  expect(layoutCss).toContain('.cruise-line-presentation-suite')
  expect(layoutCss).toContain('.fleet-directory-section')
  expect(layoutCss).toContain('.react-create-workflow-section')
  expect(layoutCss).toContain('.turnaround-admin-setup-panel')
  expect(layoutCss).toContain('.operations-intelligence-center')
  expect(layoutCss).toContain('width: min(calc(100% - 2rem), var(--admin-home-rail-width)) !important;')
  expect(layoutCss).toContain('background: var(--admin-home-panel-background) !important;')
})
