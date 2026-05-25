const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const draftPath = path.join(projectRoot, 'frontend/react/src/domain/customerDrafts.js')
const componentPath = path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx')
const stylesPath = path.join(projectRoot, 'frontend/react/src/styles/app.css')
const planPath = path.join(projectRoot, 'docs/react-migration-plan.md')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

const requiredFiles = [
  draftPath,
  componentPath,
  stylesPath,
  planPath
]

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file))

if (missingFiles.length > 0) {
  console.error(`Missing React Stage 4 files:
${missingFiles.join('\n')}`)
  process.exit(1)
}

const drafts = fs.readFileSync(draftPath, 'utf8')
const component = fs.readFileSync(componentPath, 'utf8')
const styles = fs.readFileSync(stylesPath, 'utf8')
const plan = fs.readFileSync(planPath, 'utf8')

const expectedDraftExports = [
  'export function createCustomerDraft',
  'export function updateCustomerDraftField',
  'export function validateCustomerDraft',
  'export function summarizeCustomerDraftChanges'
]

const missingExports = expectedDraftExports.filter(exportName => !drafts.includes(exportName))

if (missingExports.length > 0) {
  console.error(`React Stage 4 customer draft module is missing exports:
${missingExports.join('\n')}`)
  process.exit(1)
}

if (!component.includes("from '../domain/customerDrafts.js'")) {
  console.error('React hierarchy component must consume the Stage 4 customer draft state module.')
  process.exit(1)
}

if (!component.includes('customerDrafts') || !component.includes('CustomerDraftForm')) {
  console.error('React hierarchy component must own customer draft editor state before API mutation wiring.')
  process.exit(1)
}

if (!component.includes('data-testid="react-customer-draft-row"') || !component.includes('data-testid="react-validate-customer-draft"')) {
  console.error('React customer draft workflow must expose stable test IDs for future component and browser coverage.')
  process.exit(1)
}

if (!component.includes('API mutation wiring is intentionally deferred')) {
  console.error('Stage 4 must keep draft validation separate from live API mutation.')
  process.exit(1)
}

if (!styles.includes('.draft-editor') || !styles.includes('.draft-message')) {
  console.error('React Stage 4 draft editor styles must be present.')
  process.exit(1)
}

if (!plan.includes('Stage 4: Customer edit draft state')) {
  console.error('React migration plan must document Stage 4 customer draft state.')
  process.exit(1)
}

if (packageJson.scripts['react:stage4:audit'] !== 'node scripts/verify-react-stage-4.js') {
  console.error('package.json must expose the React Stage 4 audit script.')
  process.exit(1)
}

if (!packageJson.scripts['react:migration:audit'].includes('react:stage4:audit')) {
  console.error('React migration audit must include Stage 4 guardrails.')
  process.exit(1)
}

console.log('React Stage 4 customer draft state guardrails verified.')
