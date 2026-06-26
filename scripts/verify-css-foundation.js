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
]) {
  assert(styles.componentIndex.includes(componentImport), `components/index.css must include ${componentImport}`)
}

assert(
  styles.appCss.includes('LEGACY STYLESHEET - Cruise Explorer CSS Foundation Refactor'),
  'app.css must remain clearly labeled as the legacy compatibility stylesheet'
)

for (const phase of [2, 4, 5, 15, 16, 17, 18, 19, 20, 21, 22, 23]) {
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

for (const retiredPhase of [7, 8, 9, 10, 11, 12, 13, 14]) {
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
  const combinedArchitecture = `${styles.layout}\n${styles.panel}\n${styles.card}\n${styles.button}\n${styles.navigation}\n${styles.selectorCard}`
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


const markdownReferenceSearchRoots = [
  'scripts',
  'tests/unit',
]
for (const root of markdownReferenceSearchRoots) {
  const rootPath = path.join(projectRoot, root)
  const stack = [rootPath]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const entryPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(entryPath)
        continue
      }
      if (!/\.(js|cjs|mjs|jsx|ts|tsx|json)$/.test(entry.name)) continue
      const content = fs.readFileSync(entryPath, 'utf8')
      const relativePath = path.relative(projectRoot, entryPath)
      assert(!/['"][^'"]+\.md['"]/.test(content), `${relativePath} must not use Markdown files as production/test gate inputs`)
    }
  }
}

console.log('CSS foundation audit passed.')
