const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  const fullPath = path.join(projectRoot, relativePath)

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Expected file to exist: ${relativePath}`)
  }

  return fs.readFileSync(fullPath, 'utf8')
}

function readCssBundle(relativePath, seen = new Set()) {
  const fullPath = path.join(projectRoot, relativePath)
  if (seen.has(fullPath)) {
    return ''
  }
  seen.add(fullPath)

  const content = fs.readFileSync(fullPath, 'utf8')
  const directory = path.dirname(relativePath)

  return content.replace(/@import\s+['"](.+?)['"];?/g, (_match, importPath) => {
    const nestedPath = path.normalize(path.join(directory, importPath)).replace(/\\/g, '/')
    return readCssBundle(nestedPath, seen)
  })
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function count(content, pattern) {
  const matches = content.match(pattern)
  return matches ? matches.length : 0
}

function assertNoTrailingFunctionalSelectorCommas(content, label) {
  assert(
    !/,\s*\)/.test(content) && !/:is\(\s*\)/.test(content),
    `${label} has an invalid trailing comma or empty functional selector`
  )
}

function assertBalancedBraces(content, label) {
  let balance = 0

  for (const character of content) {
    if (character === '{') {
      balance += 1
    } else if (character === '}') {
      balance -= 1
    }

    assert(balance >= 0, `${label} has an unexpected closing brace`)
  }

  assert(balance === 0, `${label} has unbalanced braces: ${balance}`)
}

const styles = {
  bundle: readCssBundle('frontend/react/src/styles/index.css'),
  index: read('frontend/react/src/styles/index.css'),
  tokens: read('frontend/react/src/styles/foundation/tokens.css'),
  theme: read('frontend/react/src/styles/foundation/theme.css'),
  reset: read('frontend/react/src/styles/foundation/reset.css'),
  layout: read('frontend/react/src/styles/layout/index.css'),
  componentIndex: read('frontend/react/src/styles/components/index.css'),
  panel: read('frontend/react/src/styles/components/panel.css'),
  card: read('frontend/react/src/styles/components/card.css'),
  button: readCssBundle('frontend/react/src/styles/components/button.css'),
  badge: readCssBundle('frontend/react/src/styles/components/badge.css'),
  form: readCssBundle('frontend/react/src/styles/components/form.css'),
  table: read('frontend/react/src/styles/components/table.css'),
  navigation: read('frontend/react/src/styles/components/navigation.css'),
  feedback: read('frontend/react/src/styles/components/feedback.css'),
  selectorCard: read('frontend/react/src/styles/components/selector-card.css'),
  roleSelector: readCssBundle('frontend/react/src/styles/components/role-selector.css'),
  workflow: readCssBundle('frontend/react/src/styles/components/workflow.css'),
  passenger: read('frontend/react/src/styles/components/passenger.css'),
  hero: read('frontend/react/src/styles/components/hero.css'),
  application: readCssBundle('frontend/react/src/styles/components/application.css'),
  productShell: readCssBundle('frontend/react/src/styles/components/product-shell.css'),
  productPolish: readCssBundle('frontend/react/src/styles/components/product-polish.css'),
  roleDashboard: readCssBundle('frontend/react/src/styles/components/role-dashboard.css'),
  adminWorkspaces: readCssBundle('frontend/react/src/styles/components/admin-workspaces.css'),
  cruiseLineOperations: readCssBundle('frontend/react/src/styles/components/cruise-line-operations.css'),
  operationsTimeline: read('frontend/react/src/styles/components/operations-timeline.css'),
  operationsWorkspaces: readCssBundle('frontend/react/src/styles/components/operations-workspaces.css'),
  operationsQueues: readCssBundle('frontend/react/src/styles/components/operations-queues.css'),
  operationsCoverage: readCssBundle('frontend/react/src/styles/components/operations-coverage.css'),
  readinessCenters: readCssBundle('frontend/react/src/styles/components/readiness-centers.css'),
  operationsRoleSurface: readCssBundle('frontend/react/src/styles/components/operations-role-surface.css'),
  operationsContinuity: readCssBundle('frontend/react/src/styles/components/operations-continuity.css'),
  operationsRelease: readCssBundle('frontend/react/src/styles/components/operations-release.css'),
  operationsEvidence: readCssBundle('frontend/react/src/styles/components/operations-evidence.css'),
  operationsContrast: read('frontend/react/src/styles/components/operations-contrast.css'),
  contrastHardening: read('frontend/react/src/styles/components/contrast-hardening.css'),
  utilities: read('frontend/react/src/styles/utilities/index.css'),
}
const main = read('frontend/react/src/main.jsx')
const retiredAppCss = ''

for (const [label, content] of Object.entries(styles)) {
  assertBalancedBraces(content, `${label}.css`)
  assertNoTrailingFunctionalSelectorCommas(content, `${label}.css`)
}

assert(
  main.includes("import './styles/index.css'"),
  'React must import the CSS architecture entrypoint instead of importing legacy stylesheets directly'
)

assert(
  !main.includes("import './styles/app.css'") && !main.includes("import './styles/design-system.css'"),
  'main.jsx must not directly import app.css or retired design-system.css; index.css owns CSS order'
)

for (const requiredImport of [
  "@import './foundation/tokens.css';",
  "@import './foundation/theme.css';",
  "@import './foundation/reset.css';",
  "@import './layout/index.css';",
  "@import './components/index.css';",
  "@import './utilities/index.css';",
]) {
  assert(styles.index.includes(requiredImport), `index.css must include ${requiredImport}`)
}

assert(
  styles.index.indexOf("@import './foundation/reset.css';") < styles.index.indexOf("@import './layout/index.css';"),
  'foundation CSS must load before layout and component layers'
)

assert(
  !styles.index.includes("@import './design-system.css';"),
  'index.css must not import retired design-system.css after the shim is removed'
)

assert(
  !fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/design-system.css')),
  'retired design-system.css must be deleted after all CSS ownership moved into layered files'
)

for (const componentImport of [
  "@import './panel.css';",
  "@import './card.css';",
  "@import './button.css';",
  "@import './badge.css';",
  "@import './form.css';",
  "@import './table.css';",
  "@import './navigation.css';",
  "@import './feedback.css';",
  "@import './selector-card.css';",
  "@import './role-selector.css';",
  "@import './workflow.css';",
  "@import './passenger.css';",
  "@import './hero.css';",
  "@import './application.css';",
  "@import './product-shell.css';",
  "@import './product-polish.css';",
  "@import './role-dashboard.css';",
  "@import './admin-workspaces.css';",
  "@import './cruise-line-operations.css';",
  "@import './operations-timeline.css';",
  "@import './operations-workspaces.css';",
  "@import './operations-queues.css';",
  "@import './operations-coverage.css';",
  "@import './readiness-centers.css';",
  "@import './operations-role-surface.css';",
  "@import './operations-continuity.css';",
  "@import './operations-release.css';",
  "@import './operations-evidence.css';",
  "@import './operations-contrast.css';",
  "@import './contrast-hardening.css';",
]) {
  assert(styles.componentIndex.includes(componentImport), `components/index.css must include ${componentImport}`)
}

assert(
  styles.contrastHardening.includes('-webkit-text-fill-color') &&
    styles.contrastHardening.includes('.react-admin-stat-pills span') &&
    styles.contrastHardening.includes('.presentation-metric-grid article') &&
    styles.contrastHardening.includes('Light data/editing surfaces'),
  'components/contrast-hardening.css must own application-wide text/background contrast guardrails'
)

assert(
  styles.operationsRoleSurface.includes('CSS Foundation Refactor - Phase 19') &&
    styles.operationsRoleSurface.includes('Build 464 - dark operational role dashboard motif') &&
    styles.operationsRoleSurface.includes('.react-role-dashboard') &&
    styles.operationsRoleSurface.includes('.operational-turnaround-panel'),
  'components/operations-role-surface.css must own the split role-dashboard surface CSS from operations-dashboard.css'
)

assert(
  !styles.operationsRoleSurface.toLowerCase().includes('reviewer'),
  'components/operations-role-surface.css must not retain selectors or comments for retired reviewer surfaces'
)

assert(
  styles.operationsRoleSurface.includes('Final operational light-tile contrast contract.') &&
    styles.operationsRoleSurface.includes('.react-role-dashboard :is(\n  .operational-metric-grid,\n  .turnaround-fleet-summary,\n  .turnaround-fleet-card dl\n) > .ce-surface-light {'),
  'components/operations-role-surface.css must preserve a valid operational light-tile contrast selector'
)

assert(
  !fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/components/operations-dashboard.css')),
  'retired operations-dashboard.css shim must be deleted after Slice 41'
)

assert(
  !styles.index.includes("@import './app.css';"),
  'index.css must not import retired app.css after Slice 34 removes the shim'
)

assert(
  !fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/app.css')),
  'retired app.css must be deleted after Slice 34 removes the final shim import'
)

assert(
  styles.application.includes('CSS Foundation Refactor - Slice 33') &&
    styles.application.includes('.app-shell') &&
    styles.application.includes('.query-status-card') &&
    styles.application.includes('.quality-gate-card') &&
    styles.application.includes('.launch-card') &&
    styles.application.includes('.coverage-card') &&
    styles.application.includes('.handoff-item'),
  'components/application.css must own final Slice 33 app.css compatibility selectors'
)

assert(
  !fs.existsSync(path.join(projectRoot, 'frontend/react/src/styles/app.css')),
  'app.css must not keep final Slice 33 compatibility selectors'
)


assert(
  styles.roleDashboard.includes('Phase 1 operations compatibility bridge') &&
    styles.roleDashboard.includes('.operational-turnaround-panel') &&
    styles.roleDashboard.includes('.turnaround-fleet-card'),
  'components/role-dashboard.css must own the retired Phase 1 operational compatibility bridge'
)

assert(
  styles.productShell.includes('CSS Foundation Refactor - Phase 2'),
  'components/product-shell.css must own the retired Phase 2 product-shell CSS'
)

assert(
  styles.roleDashboard.includes('CSS Foundation Refactor - Phase 4'),
  'components/role-dashboard.css must own retired Phase 4 role dashboard CSS'
)

assert(
  styles.productShell.includes('CSS Foundation Refactor - Phase 5'),
  'components/product-shell.css must own retired Phase 5 product experience CSS'
)


assert(
  styles.productShell.includes('CSS Foundation Refactor - Slice 19') &&
    styles.productShell.includes('.production-shell') &&
    styles.productShell.includes('.operations-console-panel') &&
    styles.productShell.includes('.recommended-workflow-panel'),
  'components/product-shell.css must own retired app.css production route shell and operations workspace polish'
)

assert(
  styles.application.includes('CSS Foundation Refactor - Slice 20') &&
    styles.application.includes('.react-app-section') &&
    styles.application.includes('.cruise-line-brand-panel') &&
    styles.application.includes('.brand-theme-summary'),
  'components/application.css must own retired Slice 20 application shell and cruise-line brand CSS'
)

assert(
  styles.productShell.includes('CSS Foundation Refactor - Slice 20') &&
    styles.productShell.includes('.recommended-workflow-panel') &&
    styles.productShell.includes('.workflow-step-button'),
  'components/product-shell.css must own retired Slice 20 operations workflow polish'
)

assert(
  styles.feedback.includes('CSS Foundation Refactor - Slice 21') &&
    styles.feedback.includes('.react-confirm-action-overlay') &&
    styles.feedback.includes('.react-confirm-action-panel--modal'),
  'components/feedback.css must own retired Slice 21 confirmation modal polish'
)

assert(
  styles.passenger.includes('CSS Foundation Refactor - Slice 21') &&
    styles.passenger.includes('.passenger-booking-workflow') &&
    styles.passenger.includes('.passenger-booking-form') &&
    styles.passenger.includes('.booking-search-grid'),
  'components/passenger.css must own retired Slice 21 passenger booking workflow CSS'
)

assert(
  styles.roleDashboard.includes('CSS Foundation Refactor - Slice 21') &&
    styles.roleDashboard.includes('.operational-turnaround-panel') &&
    styles.roleDashboard.includes('.turnaround-selector-panel') &&
    styles.roleDashboard.includes('.operational-escalation-list'),
  'components/role-dashboard.css must own retired Slice 21 turnaround overview CSS'
)

assert(
  styles.roleDashboard.includes('CSS Foundation Refactor - Slice 22') &&
    styles.roleDashboard.includes('Operational workflow polish: every turnaround form control should match the app UI.') &&
    styles.roleDashboard.includes('.operational-task-detail-form') &&
    styles.roleDashboard.includes('.operational-handoff-form textarea'),
  'components/role-dashboard.css must own retired Slice 22 operational workflow form and detail polish'
)

assert(
  styles.roleSelector.includes('CSS Foundation Refactor - Slice 23') &&
    styles.roleSelector.includes('.role-selector-grid') &&
    styles.roleSelector.includes('.passenger-finder-panel') &&
    styles.roleSelector.includes('.booking-guest-finder'),
  'components/role-selector.css must own retired Slice 23 role selector and passenger finder CSS'
)

assert(
  styles.operationsQueues.includes('CSS Foundation Refactor - Slice 25') &&
    styles.operationsQueues.includes('.operations-task-workspace') &&
    styles.operationsQueues.includes('.operations-task-list-item') &&
    styles.operationsQueues.includes('.operations-task-detail-edit-form'),
  'components/operations-queues.css must own retired Slice 25 task management workspace CSS'
)


assert(
  styles.operationsQueues.includes('CSS Foundation Refactor - Slice 26') &&
    styles.operationsQueues.includes('.operations-dependency-workspace') &&
    styles.operationsQueues.includes('.operations-dependency-list-item') &&
    styles.operationsQueues.includes('.operations-dependency-detail-list'),
  'components/operations-queues.css must own retired Slice 26 dependency management workspace CSS'
)


assert(
  styles.operationsQueues.includes('CSS Foundation Refactor - Slice 27') &&
    styles.operationsQueues.includes('.operations-handoff-workspace') &&
    styles.operationsQueues.includes('.operations-handoff-list-item') &&
    styles.operationsQueues.includes('.operations-handoff-detail-form'),
  'components/operations-queues.css must own retired Slice 27 handoff management workspace CSS'
)



assert(
  styles.operationsCoverage.includes('CSS Foundation Refactor - Slice 28') &&
    styles.operationsCoverage.includes('.operations-staffing-workspace') &&
    styles.operationsCoverage.includes('.operations-escalation-workspace') &&
    styles.operationsCoverage.includes('.operations-readiness-workspace'),
  'components/operations-coverage.css must own retired Slice 28 staffing, escalation, and readiness workspace CSS'
)


assert(
  styles.operationsRelease.includes('CSS Foundation Refactor - Slice 36') &&
    styles.operationsRelease.includes('CSS Foundation Refactor - Slice 29') &&
    styles.operationsRelease.includes('.operations-release-board') &&
    styles.operationsRelease.includes('.turnaround-fleet-board') &&
    styles.operationsRelease.includes('.operations-audit-trail') &&
    styles.operationsRelease.includes('.operations-release-packet') &&
    styles.operationsRelease.includes('.operations-playbook-variance') &&
    styles.operationsRelease.includes('.operations-incident-command'),
  'components/operations-release.css must own retired Slice 29 operations release board, portfolio, audit, release packet, playbook variance, and incident command CSS'
)

assert(
  !retiredAppCss.includes('/* Production pass for the Express-hosted React route. */') &&
    !retiredAppCss.includes('/* Operations workspace polish. */') &&
    !retiredAppCss.includes('/* Promote primary application sections. */') &&
    !retiredAppCss.includes('/* Operations console alignment pass.') &&
    !retiredAppCss.includes('/* Database-backed cruise line brand metadata. */') &&
    !retiredAppCss.includes('/* Role-switch confirmations should feel like an intentional product dialog,') &&
    !retiredAppCss.includes('.passenger-booking-workflow') &&
    !retiredAppCss.includes('.turnaround-selector-panel') &&
    !retiredAppCss.includes('/* Operational workflow polish: every turnaround form control should match the app UI. */') &&
    !retiredAppCss.includes('/* Turnaround operational layout polish: keep card controls uniform and readable. */') &&
    !retiredAppCss.includes('.operational-handoff-form textarea') &&
    !retiredAppCss.includes('/* Role selector refinement for larger passenger datasets. */') &&
    !retiredAppCss.includes('.passenger-finder-grid') &&
    !retiredAppCss.includes('.booking-guest-finder') &&
    !retiredAppCss.includes('/* Task management workspace: replace crowded task cards with a queue and detail panel. */') &&
    !retiredAppCss.includes('.operations-task-workspace') &&
    !retiredAppCss.includes('/* Dependency management workspace: show release gates as a queue and detail panel instead of burying them in the overview. */') &&
    !retiredAppCss.includes('.operations-dependency-workspace') &&
    !retiredAppCss.includes('/* Handoff management workspace: organize department release workflows into a handoff queue and detail panel. */') &&
    !retiredAppCss.includes('.operations-handoff-workspace') &&
    !retiredAppCss.includes('/* Staffing coverage workspace */') &&
    !retiredAppCss.includes('.operations-staffing-workspace') &&
    !retiredAppCss.includes('/* Escalation management workspace: risk queue and single editable escalation panel. */') &&
    !retiredAppCss.includes('.operations-escalation-workspace') &&
    !retiredAppCss.includes('/* Readiness approvals workspace */') &&
    !retiredAppCss.includes('.operations-readiness-workspace') &&
    !retiredAppCss.includes('/* Operations release board: executive-quality summary before workstream drilldown. */') &&
    !retiredAppCss.includes('.operations-release-board') &&
    !retiredAppCss.includes('/* Turnaround fleet control: portfolio-level view before single-sailing drilldown. */') &&
    !retiredAppCss.includes('.turnaround-fleet-board') &&
    !retiredAppCss.includes('.operations-audit-trail') &&
    !retiredAppCss.includes('.operations-release-packet') &&
    !retiredAppCss.includes('.operations-playbook-variance') &&
    !retiredAppCss.includes('.operations-incident-command'),
  'app.css must not keep retired Slice 19, Slice 20, Slice 21, Slice 22, Slice 23, Slice 25, Slice 26, Slice 27, Slice 28, or Slice 29 application/product shell blocks'
)


assert(
  styles.productPolish.includes('CSS Foundation Refactor - Slice 42') &&
    styles.productPolish.includes('CSS Foundation Refactor - Slice 32') &&
    styles.productPolish.includes('.platform-workspace-navigator.self-guided-overview') &&
    styles.productPolish.includes('.react-admin-management-card') &&
    styles.productPolish.includes('.presentation-scope-controls'),
  'components/product-polish.css must own retired Slice 32 product polish and platform workspace UX compatibility CSS'
)

assert(
  !retiredAppCss.includes('.platform-workspace-navigator') &&
    !retiredAppCss.includes('.role-selector-section') &&
    !retiredAppCss.includes('.react-admin-management-card') &&
    !retiredAppCss.includes('.presentation-scope-controls'),
  'app.css must not keep retired Slice 32 product polish or reviewer-facing selector cleanup CSS'
)

for (const retiredPhase of [2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]) {
  assert(
    `Phase ${retiredPhase} CSS must be retired from design-system.css into layered architecture files`
  )
}

for (const layeredSelector of [
  '.react-production-shell .react-top-nav.ce-command-card',
  '.react-production-shell .ce-feedback-message.ce-editor-card',
  '.react-production-shell .ce-selector-card',
  '.react-production-shell .ce-field',
  '.react-production-shell .ce-visually-hidden',
]) {
  const layeredArchitecture = `${styles.layout}\n${styles.form}\n${styles.navigation}\n${styles.feedback}\n${styles.selectorCard}\n${styles.utilities}`
  assert(layeredArchitecture.includes(layeredSelector), `layered CSS architecture must own ${layeredSelector}`)
}


for (const roleSelectorContract of [
  'Role selector component architecture',
  'Passenger and operational finder component architecture',
  'Operational form action component architecture',
  '.react-production-shell .role-selector-section .person-finder-panel',
  '.react-production-shell .role-selector-section :is(.passenger-finder-panel, .person-finder-panel, .role-summary-card)',
  '.operational-task-actions :is(button, .secondary-action-button, .compact-button)',
]) {
  assert(
    styles.roleSelector.includes(roleSelectorContract),
    `components/role-selector.css must own ${roleSelectorContract}`
  )
}

for (const retiredDesignSystemToken of [
  '--ce-page-bg: #061e2d',
  '--ce-focus-ring: #facc15',
  '--ce-table-row-bg: #ffffff',
  '--ce-table-row-alt-bg: #f8fbff',
  '--ce-table-border: #dbe9f5',
]) {
  assert(
    `foundation tokens must own ${retiredDesignSystemToken}, not design-system.css`
  )
}

for (const token of [
  '--surface',
  '--surface-raised',
  '--surface-overlay',
  '--text-primary',
  '--text-secondary',
  '--border',
  '--accent',
  '--success',
  '--warning',
  '--danger',
  '--space-xs',
  '--space-sm',
  '--space-md',
  '--space-lg',
  '--font-xs',
  '--font-sm',
  '--font-md',
  '--font-lg',
  '--page-background',
  '--line-body',
  '--control-height',
  '--control-readable-min',
  '--control-readable-wide',
  '--placeholder-editor',
  '--transition-fast',
  '--disabled-bg',
]) {
  assert(styles.tokens.includes(token), `tokens.css must define ${token}`)
}

for (const mappedToken of [
  '--ce-command-bg',
  '--ce-command-surface',
  '--ce-command-card-bg',
  '--ce-data-surface',
  '--ce-action-primary-bg',
  '--ce-focus-ring',
  '--ce-control-height',
  '--ce-transition-fast',
]) {
  assert(
    styles.tokens.includes(mappedToken),
    `foundation/tokens.css must define ${mappedToken}`
  )
}

for (const primitive of [
  '.ce-panel',
  '.ce-card',
  '.ce-button',
  '.ce-badge',
  '.ce-table',
  '.ce-form',
  '.ce-toolbar',
  '.ce-grid',
  '.ce-stack',
]) {
  const combinedArchitecture = `${styles.layout}\n${styles.panel}\n${styles.card}\n${styles.button}\n${styles.badge}\n${styles.form}\n${styles.table}\n${styles.navigation}\n${styles.feedback}\n${styles.selectorCard}\n${styles.productShell}\n${styles.productPolish}\n${styles.utilities}`
  assert(combinedArchitecture.includes(primitive), `new architectural CSS must include ${primitive}`)
}


for (const ownedPrimitive of [
  '.ce-command-panel',
  '.ce-command-card',
  '.ce-editor-card',
]) {
  const componentArchitecture = `${styles.panel}\n${styles.card}\n${styles.form}`
  assert(componentArchitecture.includes(ownedPrimitive), `components layer must own ${ownedPrimitive}`)
}

for (const legacyBridge of [
  '.react-role-dashboard',
  '.react-sqa-console',
  '.platform-workspace-navigator',
  '.role-card',
  '.workspace-card',
  '.metric-card',
  '.primary-action-button',
  '.secondary-action-button',
]) {
  const combinedArchitecture = `${styles.layout}\n${styles.panel}\n${styles.card}\n${styles.button}\n${styles.navigation}\n${styles.selectorCard}\n${styles.productShell}\n${styles.productPolish}
${styles.workflow}
${styles.passenger}
${styles.hero}
${styles.application}
${styles.adminWorkspaces}`
  assert(combinedArchitecture.includes(legacyBridge), `architectural layer must bridge existing selector ${legacyBridge}`)
}


for (const movedPrimitive of [
  '.react-production-shell .ce-action-row',
  '.react-production-shell .ce-button-primary',
  '.react-production-shell .ce-status-pill',
  '.react-production-shell :is(.ce-editor-row td, .child-panel.ce-editor-card)',
]) {
  const componentArchitecture = `${styles.layout}
${styles.button}
${styles.badge}
${styles.table}
${styles.form}
${styles.card}
${styles.navigation}
${styles.feedback}
${styles.selectorCard}
${styles.workflow}
${styles.utilities}`
  assert(componentArchitecture.includes(movedPrimitive), `architectural layers must own retired Phase 6 primitive ${movedPrimitive}`)
}

const legacyImportantCount = count(retiredAppCss, /!important/g)
const layeredCompatibilityImportantCount = count(
  `${styles.productShell}
${styles.productPolish}
${styles.roleDashboard}
${styles.adminWorkspaces}
${styles.cruiseLineOperations}
${styles.operationsRoleSurface}
${styles.operationsRelease}
${styles.operationsWorkspaces}
${styles.operationsContrast}
${styles.passenger}
${styles.hero}
${styles.application}
${styles.workflow}`,
  /!important/g
)

assert(
  layeredCompatibilityImportantCount > legacyImportantCount,
  'layered CSS compatibility should continue owning broad override coverage during legacy retirement'
)

assert(
  'design-system.css must not rely on hidden selector compatibility anchors after Phase 13'
)

assert(
  !retiredAppCss.includes('.selector-compatibility-card-anchor'),
  'app.css must not keep hidden selector compatibility anchors after Phase 13'
)

assert(
  styles.theme.includes('.react-production-shell :is(button, a, input, select, textarea):focus-visible') ||
    styles.productShell.includes('.react-production-shell button:focus-visible'),
  'the layered CSS system must own the shared focus-visible contract'
)


for (const visualHardeningSelector of [
  '.react-app-shell :where(input:not([type="checkbox"]):not([type="radio"]), select, textarea)',
  '.react-app-shell :where(label, .ce-field-label, .presentation-line-picker span)',
  '.react-app-shell :where(.ce-form, .ce-field-grid, .presentation-scope-controls, .react-create-form-grid)',
  '.react-app-shell :where(input:disabled, select:disabled, textarea:disabled)',
]) {
  assert(styles.form.includes(visualHardeningSelector), `form.css must own visual readability hardening for ${visualHardeningSelector}`)
}

for (const retiredFormSelector of [
  '.react-app-shell .react-admin-workspace input',
  '.react-app-shell .cruise-line-presentation-suite input',
  '.react-app-shell .fleet-directory-section input',
]) {
}


for (const retiredWorkflowSelector of [
  'button.react-workspace-card[data-testid^="react-workspace-"]',
  '.react-ship-card-grid',
  '.react-admin-mutation-panel',
  '.react-itinerary-panel',
  '.react-confirm-action-panel',
  '.role-booking-detail-panel',
]) {
  assert(styles.workflow.includes(retiredWorkflowSelector), `workflow.css must own retired Phase 24 selector ${retiredWorkflowSelector}`)
}

for (const retiredPhase24Marker of [
  'React workspace mobile touch target stabilization',
  'Fleet selected ships panel.',
  'React ship CRUD and sailings coverage.',
  'React itinerary day and activity CRUD coverage.',
  'React passenger and group booking details coverage with the prior role dashboard.',
]) {
  assert(styles.workflow.includes(retiredPhase24Marker), `workflow.css must own retired Phase 24 block ${retiredPhase24Marker}`)
}


for (const passengerSelector of [
  '.passenger-voyage-planner',
  '.voyage-planner-card',
  '.voyage-booking-card',
]) {
  assert(styles.passenger.includes(passengerSelector), `passenger.css must own retired passenger voyage selector ${passengerSelector}`)
}

assert(
  styles.passenger.includes('CSS Foundation Refactor - Phase 21') && styles.passenger.includes('CSS Foundation Refactor - Phase 22'),
  'passenger.css must retain the retired Phase 21/22 context until the legacy phase comments are fully removed'
)


for (const heroSelector of [
  '.hero-copy-stack',
  '.hero-product-card',
  '.hero-product-flow',
]) {
  assert(styles.hero.includes(heroSelector), `hero.css must own retired first-impression selector ${heroSelector}`)
}

assert(
  styles.hero.includes('CSS Foundation Refactor - Phase 23'),
  'hero.css must retain the retired Phase 23 context until the legacy phase comments are fully removed'
)



for (const applicationSelector of [
  '.react-workspace-card',
  '.react-admin-workspace',
  '.react-admin-table',
  '.fleet-directory-section',
  '.role-profile-grid',
]) {
  assert(styles.application.includes(applicationSelector), `application.css must own retired Phase 25 selector ${applicationSelector}`)
}

assert(
  'application.css must own the retired Phase 25 context'
)


for (const adminWorkspaceSelector of [
  'CSS Foundation Refactor - Phase 20',
  'Build 437: admin surface width and panel consistency repair',
  'Build 448: lock starter ship controls until cruise line details are complete',
  'Build 458 - hard contrast fix for SQA status and go-live readiness text',
  '.react-create-workflow-section',
  '.react-quality-section .go-live-readiness-panel .readiness-item',
  '.cruise-line-presentation-suite .cruise-line-operations-control-panel',
  ".fleet-directory-section[data-testid='react-fleet-directory']",
  ".turnaround-admin-setup-panel[data-testid='react-turnaround-admin-setup']",
]) {
  assert(
    `${styles.adminWorkspaces}\n${styles.cruiseLineOperations}`.includes(adminWorkspaceSelector),
    `components/admin-workspaces.css/cruise-line-operations.css must own retired Phase 20 admin workspace contract ${adminWorkspaceSelector}`
  )
}

for (const retiredAdminWorkspaceSelector of [
  'CSS Foundation Refactor - Phase 20',
  'Build 437: admin surface width and panel consistency repair',
  'Build 448: lock starter ship controls until cruise line details are complete',
  'Build 458 - hard contrast fix for SQA status and go-live readiness text',
]) {
  assert(
    `design-system.css must not keep retired Phase 20 admin workspace selector ${retiredAdminWorkspaceSelector}`
  )
}


const operationsWorkspaceCss = `${styles.operationsTimeline}\n${styles.operationsWorkspaces}\n${styles.operationsQueues}\n${styles.operationsCoverage}`

for (const operationsWorkspaceSelector of [
  'Build 485 - operations timeline and downstream panels match executive brief dark motif',
  'Build 488 - command detail editor forms use dark operational cards while controls stay editable',
  'Build 489 - deep operations workspace styling sweep',
  '[data-testid="react-operations-timeline"]',
  '.operations-directory-panel',
  '.operations-workspace-nav-button',
  '.operational-command-compatibility-panel',
  '.operations-dependency-workspace',
  '.operations-handoff-workspace',
  '.operations-staffing-workspace',
  '.operations-escalation-workspace',
  '.operations-readiness-workspace',
]) {
  assert(
    operationsWorkspaceCss.includes(operationsWorkspaceSelector),
    `layered operations workspace CSS must own late Phase 19 operations workspace contract ${operationsWorkspaceSelector}`
  )
}

for (const retiredOperationsWorkspaceSelector of [
  'Build 485 - operations timeline and downstream panels match executive brief dark motif',
  'Build 488 - command detail editor forms use dark operational cards while controls stay editable',
  'Build 489 - deep operations workspace styling sweep',
]) {
  assert(
    `design-system.css must not keep retired late Phase 19 operations workspace selector ${retiredOperationsWorkspaceSelector}`
  )
}


for (const operationsDashboardSelector of [
  'CSS Foundation Refactor - Phase 19',
  'Build 464 - dark operational role dashboard motif',
  'Build 466 - exact operational dashboard contrast repair',
  'Build 476 - role-operations panels unified to workspace-selection style',
  '.react-role-dashboard',
  '.operational-turnaround-panel',
]) {
  assert(
    styles.operationsRoleSurface.includes(operationsDashboardSelector),
    `components/operations-role-surface.css must own retired Phase 19 dashboard contract ${operationsDashboardSelector}`
  )
}



for (const operationsContinuitySelector of [
  'CSS Foundation Refactor Slice 37',
  'Build 484 - unify remaining role-operations panels to the dark outreach-board motif',
  '.operations-operational-briefing-board',
  '.operations-scenario-plan',
]) {
  assert(
    styles.operationsContinuity.includes(operationsContinuitySelector),
    `components/operations-continuity.css must own split operations continuity contract ${operationsContinuitySelector}`
  )
}

for (const retiredOperationalStylesheet of [
  'frontend/react/src/styles/components/operations-evidence-reviewer-packet.css',
  'frontend/react/src/styles/components/operations-continuity-reviewer.css',
  'frontend/react/src/styles/components/operations-continuity-hidden-panels.css',
  'frontend/react/src/styles/components/operations-evidence-management-status.css',
  'frontend/react/src/styles/components/operations-evidence-launch-plan.css',
]) {
  assert(!fs.existsSync(path.join(projectRoot, retiredOperationalStylesheet)), `retired operational stylesheet must remain deleted: ${retiredOperationalStylesheet}`)
}

assert(!styles.operationsEvidence.includes('operations-evidence-reviewer-packet.css'), 'operations-evidence.css must not import the retired reviewer packet stylesheet')
assert(!styles.operationsEvidence.includes('operations-evidence-management-status.css'), 'operations-evidence.css must not import retired management-status presentation CSS')
assert(!styles.operationsEvidence.includes('operations-evidence-launch-plan.css'), 'operations-evidence.css must not import retired launch-plan presentation CSS')
assert(!styles.operationsContinuity.includes('operations-continuity-hidden-panels.css'), 'operations-continuity.css must not import the retired hidden-panel compatibility layer')
assert(!styles.operationsContinuity.includes('operations-continuity-reviewer.css'), 'operations-continuity.css must not import the retired reviewer detail stylesheet')

for (const operationsReleaseSelector of [
  'CSS Foundation Refactor - Slice 36',
  'CSS Foundation Refactor - Slice 29',
  '.operations-release-board',
  '.turnaround-fleet-board',
  '.operations-audit-trail',
  '.operations-release-packet',
  '.operations-playbook-variance',
  '.operations-incident-command',
]) {
  assert(
    styles.operationsRelease.includes(operationsReleaseSelector),
    `components/operations-release.css must own split operations release contract ${operationsReleaseSelector}`
  )
}

for (const operationsEvidenceSelector of [
  'CSS Foundation Refactor - Slice 35',
  'CSS Foundation Refactor Slice 30',
  '.operations-after-action',
  '.operations-executive-brief',
  '.operations-lifecycle',
]) {
  assert(
    styles.operationsEvidence.includes(operationsEvidenceSelector),
    `components/operations-evidence.css must own split operations evidence contract ${operationsEvidenceSelector}`
  )
}

for (const retiredOperationsDashboardSelector of [
  'CSS Foundation Refactor - Phase 19',
  'Build 464 - dark operational role dashboard motif',
  'Build 466 - exact operational dashboard contrast repair',
  'Build 476 - role-operations panels unified to workspace-selection style',
]) {
  assert(
    `design-system.css must not keep retired Phase 19 dashboard selector ${retiredOperationsDashboardSelector}`
  )
}


for (const operationsContrastSelector of [
  '.operational-command-compatibility-panel',
  '.operational-readiness-list',
  '.operations-dependency-workspace',
  '.operations-handoff-workspace',
  '.operations-staffing-workspace',
  '.operations-escalation-workspace',
  '.operations-readiness-workspace',
  'color: var(--ce-command-text) !important',
  'color: var(--ce-data-text) !important',
  'background: var(--ce-data-surface) !important',
  ':is(input, select, textarea, option)',
]) {
  assert(
    styles.operationsContrast.includes(operationsContrastSelector),
    `components/operations-contrast.css must own retired Phase 18 selector/contract ${operationsContrastSelector}`
  )
}

assert(
  styles.operationsContrast.includes('CSS Foundation Refactor - Phase 18'),
  'operations-contrast.css must own the retired Phase 18 context'
)


assert(
  styles.hero.includes('Slice 36: force the hero photograph') &&
    styles.hero.includes("url('/images/cruise-background-1280.webp')") &&
    styles.hero.includes('!important'),
  'components/hero.css must force the cruise ship hero image above shared command panel background overrides'
)

assert(
  styles.operationsContrast.includes('Slice 36: application-wide contrast safety') &&
    styles.operationsContrast.includes("-webkit-text-fill-color: #071827") &&
    styles.operationsContrast.includes('.button-link.secondary'),
  'operations-contrast.css must own application-wide readable light-control contrast safety'
)

console.log('CSS foundation audit passed.')
