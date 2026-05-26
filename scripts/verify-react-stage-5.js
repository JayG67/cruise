const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertContains(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} must contain: ${expected}`)
  }
}

const client = read('frontend/react/src/api/client.js')
const hook = read('frontend/react/src/hooks/useCustomerProfileMutation.js')
const app = read('frontend/react/src/App.jsx')
const component = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
const customerWorkflow = read('frontend/react/src/hooks/useCustomerDraftWorkflow.js')
const customerForm = read('frontend/react/src/components/CustomerDraftForm.jsx')
const styles = read('frontend/react/src/styles/app.css')

assertContains(client, 'export async function updateCustomerProfile', 'React API client')
assertContains(client, "method: 'PATCH'", 'React API client customer mutation')
assertContains(hook, 'export default function useCustomerProfileMutation', 'React customer mutation hook')
assertContains(hook, 'savingCustomerId', 'React customer mutation hook')
assertContains(hook, 'onSaved', 'React customer mutation hook')
assertContains(app, 'useCustomerProfileMutation', 'React app shell')
assertContains(app, 'onSaveCustomerDraft={saveCustomerProfile}', 'React app shell')
assertContains(component, 'saveCustomerDraftFor', 'React customer hierarchy component')
assertContains(customerWorkflow, 'Use Save draft to exercise the React mutation boundary', 'React customer draft workflow hook')
assertContains(customerForm, 'data-testid="react-save-customer-draft"', 'React customer draft form')
assertContains(customerForm, 'Save draft', 'React customer draft form')
assertContains(styles, '.primary-button', 'React styles')
assertContains(packageJson.scripts['react:stage5:audit'], 'verify-react-stage-5.js', 'package react:stage5:audit script')
assertContains(packageJson.scripts['react:migration:audit'], 'react:stage5:audit', 'package react:migration:audit script')

console.log('React Stage 5 customer mutation boundary audit passed.')
