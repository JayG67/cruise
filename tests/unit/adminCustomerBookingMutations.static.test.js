const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('Admin customer and booking mutation architecture', () => {
  it('keeps hierarchy coordination separate from API mutation lifecycle ownership', () => {
    const hierarchyState = read('frontend/react/src/components/admin/useCustomerBookingHierarchyState.js')
    const mutations = read('frontend/react/src/components/admin/useAdminCustomerBookingMutations.js')

    expect(hierarchyState).toContain("import useAdminCustomerBookingMutations from './useAdminCustomerBookingMutations.js'")
    expect(hierarchyState).toContain('useAdminCustomerBookingMutations({ onRefresh: onRetry })')
    expect(hierarchyState).not.toContain("from '../../api/client.js'")
    expect(hierarchyState).not.toContain('createCustomer(payload)')
    expect(hierarchyState).not.toContain('deleteBooking(')

    expect(mutations).toContain("import { createBooking, createCustomer, deleteBooking, deleteCustomer } from '../../api/client.js'")
    expect(mutations).toContain('async function handleCreateCustomer')
    expect(mutations).toContain('async function handleCreateBooking')
    expect(mutations).toContain('async function executeDelete')
    expect(mutations).toContain('await refreshHierarchy()')
    expect(mutations.match(/async function executeDelete/g) || []).toHaveLength(1)
  })

  it('preserves explicit confirmation and operation-specific pending state for destructive actions', () => {
    const mutations = read('frontend/react/src/components/admin/useAdminCustomerBookingMutations.js')

    expect(mutations).toContain('setPendingDelete({')
    expect(mutations).toContain('async function confirmPendingDelete()')
    expect(mutations).toContain("setActiveDeleteId(`${type}:${id}`)")
    expect(mutations).toContain("confirmLabel: `Delete ${entityLabel}`")
    expect(mutations).toContain("setAdminMutationMessage('Delete action was cancelled.')")
  })
})
