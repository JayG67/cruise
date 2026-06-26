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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function count(content, pattern) {
  const matches = content.match(pattern)
  return matches ? matches.length : 0
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
  index: read('frontend/react/src/styles/index.css'),
  tokens: read('frontend/react/src/styles/foundation/tokens.css'),
  theme: read('frontend/react/src/styles/foundation/theme.css'),
  reset: read('frontend/react/src/styles/foundation/reset.css'),
  layout: read('frontend/react/src/styles/layout/index.css'),
  componentIndex: read('frontend/react/src/styles/components/index.css'),
  panel: read('frontend/react/src/styles/components/panel.css'),
  card: read('frontend/react/src/styles/components/card.css'),
  button: read('frontend/react/src/styles/components/button.css'),
  badge: read('frontend/react/src/styles/components/badge.css'),
  form: read('frontend/react/src/styles/components/form.css'),
  table: read('frontend/react/src/styles/components/table.css'),
  navigation: read('frontend/react/src/styles/components/navigation.css'),
  feedback: read('frontend/react/src/styles/components/feedback.css'),
  selectorCard: read('frontend/react/src/styles/components/selector-card.css'),
  workflow: read('frontend/react/src/styles/components/workflow.css'),
  passenger: read('frontend/react/src/styles/components/passenger.css'),
  hero: read('frontend/react/src/styles/components/hero.css'),
  application: read('frontend/react/src/styles/components/application.css'),
  utilities: read('frontend/react/src/styles/utilities/index.css'),
  appCss: read('frontend/react/src/styles/app.css'),
  designSystem: read('frontend/react/src/styles/design-system.css'),
}
const main = read('frontend/react/src/main.jsx')

for (const [label, content] of Object.entries(styles)) {
  assertBalancedBraces(content, `${label}.css`)
}

assert(
  main.includes("import './styles/index.css'"),
  'React must import the CSS architecture entrypoint instead of importing legacy stylesheets directly'
)

assert(
  !main.includes("import './styles/app.css'") && !main.includes("import './styles/design-system.css'"),
  'main.jsx must not directly import app.css or design-system.css; index.css owns CSS order'
)

for (const requiredImport of [
  "@import './foundation/tokens.css';",
  "@import './foundation/theme.css';",
  "@import './foundation/reset.css';",
  "@import './app.css';",
  "@import './design-system.css';",
  "@import './layout/index.css';",
  "@import './components/index.css';",
  "@import './utilities/index.css';",
]) {
  assert(styles.index.includes(requiredImport), `index.css must include ${requiredImport}`)
}

assert(
  styles.index.indexOf("@import './foundation/tokens.css';") < styles.index.indexOf("@import './app.css';"),
  'tokens.css must load before compatibility stylesheets'
)

assert(
  styles.index.indexOf("@import './design-system.css';") < styles.index.indexOf("@import './layout/index.css';"),
  'new architectural layers must load after legacy compatibility stylesheets'
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
  "@import './workflow.css';",
  "@import './passenger.css';",
  "@import './hero.css';",
  "@import './application.css';",
]) {
  assert(styles.componentIndex.includes(componentImport), `components/index.css must include ${componentImport}`)
}

assert(
  styles.appCss.includes('LEGACY STYLESHEET - Cruise Explorer CSS Foundation Refactor'),
  'app.css must remain clearly labeled as the legacy compatibility stylesheet'
)

for (const phase of [2, 4, 5, 15, 16, 17, 18, 19, 20]) {
  assert(
    styles.designSystem.includes(`CSS Foundation Refactor - Phase ${phase}`),
    `design-system.css must include the Phase ${phase} compatibility marker until that slice is retired`
  )
}

assert(
  !styles.designSystem.includes('CSS Foundation Refactor - Phase 3'),
  'Phase 3 generic ce-* primitive CSS must be retired from design-system.css; components/* owns it now'
)

assert(
  !styles.designSystem.includes('CSS Foundation Refactor - Phase 6'),
  'Phase 6 table/action primitive CSS must be retired from design-system.css; components/* and layout/* own it now'
)

for (const retiredPhase of [7, 8, 9, 10, 11, 12, 13, 14, 21, 22, 23, 24]) {
  assert(
    !styles.designSystem.includes(`CSS Foundation Refactor - Phase ${retiredPhase}`),
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
  assert(!styles.designSystem.includes(layeredSelector), `design-system.css must not keep retired selector ${layeredSelector}`)
}

for (const retiredDesignSystemToken of [
  '--ce-page-bg: #061e2d',
  '--ce-focus-ring: #facc15',
  '--ce-table-row-bg: #ffffff',
  '--ce-table-row-alt-bg: #f8fbff',
  '--ce-table-border: #dbe9f5',
]) {
  assert(
    !styles.designSystem.includes(retiredDesignSystemToken),
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
    styles.tokens.includes(mappedToken) || styles.designSystem.includes(mappedToken),
    `the layered design system must continue defining ${mappedToken}`
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
  const combinedArchitecture = `${styles.layout}\n${styles.panel}\n${styles.card}\n${styles.button}\n${styles.badge}\n${styles.form}\n${styles.table}\n${styles.navigation}\n${styles.feedback}\n${styles.selectorCard}\n${styles.utilities}`
  assert(combinedArchitecture.includes(primitive), `new architectural CSS must include ${primitive}`)
}


for (const ownedPrimitive of [
  '.ce-command-panel',
  '.ce-command-card',
  '.ce-editor-card',
]) {
  const componentArchitecture = `${styles.panel}\n${styles.card}\n${styles.form}`
  assert(componentArchitecture.includes(ownedPrimitive), `components layer must own ${ownedPrimitive}`)
  assert(!styles.designSystem.includes(`.react-production-shell ${ownedPrimitive} {`), `${ownedPrimitive} generic rule must not be redefined by design-system.css`)
}

for (const legacyBridge of [
  '.react-role-dashboard',
  '.react-sqa-console',
  '.employer-demo-command-center',
  '.role-card',
  '.workspace-card',
  '.metric-card',
  '.primary-action-button',
  '.secondary-action-button',
]) {
  const combinedArchitecture = `${styles.layout}\n${styles.panel}\n${styles.card}\n${styles.button}\n${styles.navigation}\n${styles.selectorCard}
${styles.workflow}
${styles.passenger}
${styles.hero}
${styles.application}`
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
  assert(!styles.designSystem.includes(movedPrimitive), `design-system.css must not keep retired Phase 6 primitive ${movedPrimitive}`)
}

const legacyImportantCount = count(styles.appCss, /!important/g)
const foundationImportantCount = count(styles.designSystem, /!important/g)

assert(
  foundationImportantCount > legacyImportantCount,
  'design-system.css should now own more broad override coverage than legacy app.css after Phase 20'
)

assert(
  !styles.designSystem.includes('.selector-compatibility-card-anchor'),
  'design-system.css must not rely on hidden selector compatibility anchors after Phase 13'
)

assert(
  !styles.appCss.includes('.selector-compatibility-card-anchor'),
  'app.css must not keep hidden selector compatibility anchors after Phase 13'
)

assert(
  styles.theme.includes('.react-production-shell :is(button, a, input, select, textarea):focus-visible') ||
    styles.designSystem.includes('.react-production-shell :is(button, a, input, select, textarea):focus-visible'),
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
  assert(!styles.designSystem.includes(retiredFormSelector), `design-system.css must not keep broad form readability selector ${retiredFormSelector}`)
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
  assert(!styles.designSystem.includes(retiredPhase24Marker), `design-system.css must not keep retired Phase 24 block ${retiredPhase24Marker}`)
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
  assert(!styles.designSystem.includes(heroSelector), `design-system.css must not keep retired first-impression selector ${heroSelector}`)
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
  styles.application.includes('CSS Foundation Refactor - Phase 25') && !styles.designSystem.includes('CSS Foundation Refactor - Phase 25'),
  'application.css must own the retired Phase 25 context and design-system.css must not keep it'
)


console.log('CSS foundation audit passed.')
