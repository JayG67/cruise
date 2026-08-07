const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('passenger booking workflow ownership', () => {
  const component = read('frontend/react/src/components/PassengerCruiseBookingWorkflow.jsx')
  const state = read('frontend/react/src/components/usePassengerBookingWorkflowState.js')

  test('keeps rendering separate from booking state and command orchestration', () => {
    expect(component).toContain("import usePassengerBookingWorkflowState from './usePassengerBookingWorkflowState.js'")
    expect(component).toContain('const workflow = usePassengerBookingWorkflowState({')
    expect(component).not.toContain('useState(')
    expect(component).not.toContain('useEffect(')
    expect(component).not.toContain('useMemo(')
    expect(component).not.toContain('createBooking(')
    expect(component).not.toContain('createCustomer(')
    expect(component).not.toContain('getShipsForCruiseLine(')
    expect(component).not.toContain('getSailingsForShip(')
  })

  test('keeps cascading selection, guest resolution, and submission in the state model', () => {
    expect(state).toContain('async function handleCruiseLineChange')
    expect(state).toContain('async function handleShipChange')
    expect(state).toContain('function getVisibleCustomerFinderOptions')
    expect(state).toContain('function validateBookingDraft')
    expect(state).toContain('async function resolveGuestCustomer')
    expect(state).toContain('async function handleSubmit')
    expect(state).toContain('await createBooking({')
    expect(state).toContain('await onBookingCreated?.()')
  })

  test('repairs guest-search indexes when a guest row is removed', () => {
    expect(state).toContain('Number(key) > index ? Number(key) - 1 : key')
  })
})
