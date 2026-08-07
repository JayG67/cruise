import { useState } from 'react'
import { createBooking, createCustomer, deleteBooking, deleteCustomer } from '../../api/client.js'

const EMPTY_CUSTOMER_DRAFT = Object.freeze({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  loyaltyNumber: ''
})

const EMPTY_BOOKING_DRAFT = Object.freeze({
  customerId: '',
  bookingStatus: 'CONFIRMED',
  cabinNumber: '',
  fareCode: '',
  embarkationPort: '',
  debarkationPort: ''
})

const EMPTY_CUSTOMER_DELETE_FILTERS = Object.freeze({
  cruiseLine: '',
  ship: '',
  lastName: '',
  firstNameInitial: '',
  customerId: ''
})

const EMPTY_BOOKING_DELETE_FILTERS = Object.freeze({
  cruiseLine: '',
  ship: '',
  passengerLastName: '',
  passengerFirstNameInitial: '',
  bookingId: ''
})

function createInitialState(template) {
  return { ...template }
}

export default function useAdminCustomerBookingMutations({ onRefresh } = {}) {
  const [adminMutationMessage, setAdminMutationMessage] = useState('')
  const [createCustomerDraft, setCreateCustomerDraft] = useState(() => createInitialState(EMPTY_CUSTOMER_DRAFT))
  const [createBookingDraft, setCreateBookingDraft] = useState(() => createInitialState(EMPTY_BOOKING_DRAFT))
  const [deleteCustomerId, setDeleteCustomerId] = useState('')
  const [deleteBookingId, setDeleteBookingId] = useState('')
  const [deleteCustomerFilters, setDeleteCustomerFilters] = useState(() => createInitialState(EMPTY_CUSTOMER_DELETE_FILTERS))
  const [deleteBookingFilters, setDeleteBookingFilters] = useState(() => createInitialState(EMPTY_BOOKING_DELETE_FILTERS))
  const [activeDeleteId, setActiveDeleteId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  function updateCreateCustomerDraft(fieldName, value) {
    setCreateCustomerDraft(current => ({ ...current, [fieldName]: value }))
  }

  function updateCreateBookingDraft(fieldName, value) {
    setCreateBookingDraft(current => ({ ...current, [fieldName]: value }))
  }

  async function refreshHierarchy() {
    await onRefresh?.()
  }

  async function handleCreateCustomer(event) {
    event.preventDefault()

    const payload = {
      firstName: createCustomerDraft.firstName.trim(),
      lastName: createCustomerDraft.lastName.trim(),
      email: createCustomerDraft.email.trim(),
      phone: createCustomerDraft.phone.trim(),
      loyaltyNumber: createCustomerDraft.loyaltyNumber.trim()
    }

    if (!payload.firstName || !payload.lastName || !payload.email) {
      setAdminMutationMessage('First name, last name, and email are required to create a customer.')
      return
    }

    try {
      const created = await createCustomer(payload)
      setCreateCustomerDraft(createInitialState(EMPTY_CUSTOMER_DRAFT))
      setAdminMutationMessage(`${created.firstName || payload.firstName} ${created.lastName || payload.lastName} was created through the administrative workspace.`)
      await refreshHierarchy()
    } catch (error) {
      setAdminMutationMessage(error.message || 'Unable to create customer.')
    }
  }

  async function handleCreateBooking(event) {
    event?.preventDefault?.()

    const payload = {
      customerId: createBookingDraft.customerId.trim(),
      bookingStatus: createBookingDraft.bookingStatus.trim(),
      cabinNumber: createBookingDraft.cabinNumber.trim(),
      fareCode: createBookingDraft.fareCode.trim(),
      embarkationPort: createBookingDraft.embarkationPort.trim(),
      debarkationPort: createBookingDraft.debarkationPort.trim()
    }

    if (!payload.customerId || !payload.bookingStatus || !payload.cabinNumber) {
      setAdminMutationMessage('Customer ID, booking status, and cabin number are required to create a booking.')
      return
    }

    try {
      const created = await createBooking(payload)
      setCreateBookingDraft(createInitialState(EMPTY_BOOKING_DRAFT))
      setAdminMutationMessage(`${created.id || 'New'} booking was created through the administrative workspace.`)
      await refreshHierarchy()
    } catch (error) {
      setAdminMutationMessage(error.message || 'Unable to create booking.')
    }
  }

  function requestDelete(type, id, label = id) {
    const normalizedId = String(id || '').trim()
    const entityLabel = type === 'customer' ? 'Customer' : 'Booking'

    if (!normalizedId) {
      setAdminMutationMessage(`${entityLabel} ID is required before deleting a ${type}.`)
      return
    }

    setPendingDelete({
      type,
      id: normalizedId,
      label,
      message: `Delete ${type} ${label}?`,
      confirmLabel: `Delete ${entityLabel}`
    })
  }

  function requestDeleteCustomerById(customerId, label = customerId) {
    requestDelete('customer', customerId, label)
  }

  function requestDeleteBookingById(bookingId, label = bookingId) {
    requestDelete('booking', bookingId, label)
  }

  async function executeDelete({ type, id, label = id }) {
    const isCustomer = type === 'customer'
    setActiveDeleteId(`${type}:${id}`)

    try {
      if (isCustomer) {
        await deleteCustomer(id)
        setDeleteCustomerId('')
        setDeleteCustomerFilters(createInitialState(EMPTY_CUSTOMER_DELETE_FILTERS))
      } else {
        await deleteBooking(id)
        setDeleteBookingId('')
        setDeleteBookingFilters(createInitialState(EMPTY_BOOKING_DELETE_FILTERS))
      }
      setAdminMutationMessage(`${label} ${type} was deleted through the administrative workspace.`)
      await refreshHierarchy()
    } catch (error) {
      setAdminMutationMessage(error.message || `Unable to delete ${type}.`)
    } finally {
      setActiveDeleteId('')
    }
  }

  async function confirmPendingDelete() {
    const action = pendingDelete
    if (!action) return

    try {
      await executeDelete(action)
    } finally {
      setPendingDelete(null)
    }
  }

  function cancelPendingDelete() {
    setPendingDelete(null)
    setAdminMutationMessage('Delete action was cancelled.')
  }

  function handleDeleteCustomer(event) {
    event.preventDefault()
    requestDeleteCustomerById(deleteCustomerId, deleteCustomerId.trim())
  }

  function handleDeleteBooking(event) {
    event.preventDefault()
    requestDeleteBookingById(deleteBookingId, deleteBookingId.trim())
  }

  return {
    adminMutationMessage,
    createCustomerDraft,
    createBookingDraft,
    deleteCustomerId,
    setDeleteCustomerId,
    deleteBookingId,
    setDeleteBookingId,
    deleteCustomerFilters,
    setDeleteCustomerFilters,
    deleteBookingFilters,
    setDeleteBookingFilters,
    activeDeleteId,
    pendingDelete,
    updateCreateCustomerDraft,
    updateCreateBookingDraft,
    handleCreateCustomer,
    handleCreateBooking,
    requestDeleteCustomerById,
    requestDeleteBookingById,
    confirmPendingDelete,
    cancelPendingDelete,
    handleDeleteCustomer,
    handleDeleteBooking
  }
}
