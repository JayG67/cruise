import { useEffect, useMemo, useState } from 'react'
import PassengerCruiseBookingWorkflow from './PassengerCruiseBookingWorkflow.jsx'

import {
  buildTurnaroundOperationCards,
  findDemoCustomer,
  getBookingCardFields,
  getBookingCardTitle,
  getBookingItineraryDays,
  getItineraryDayActivities,
  getRoleDashboardTitle,
  getOperationalRoleFocus,
  getRoleSummaryLine,
  getSelectedRoleView,
  isOperationalRoleView,
  getVisiblePassengerRows
} from '../domain/roleView.js'

function getSelectedPassengerPreferences(selectedCustomer, visibleBookings) {
  const selectedCustomerId = selectedCustomer?.id

  if (!selectedCustomerId) {
    return {
      diningPreference: 'Anytime dining',
      accessibilityNotes: ''
    }
  }

  const passenger = visibleBookings
    .flatMap(booking => booking.passengers || [])
    .find(row => row.customerId === selectedCustomerId || row.customer?.id === selectedCustomerId)

  return {
    diningPreference: passenger?.diningPreference || 'Anytime dining',
    accessibilityNotes: passenger?.accessibilityNotes || ''
  }
}

function buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings) {
  const preferences = getSelectedPassengerPreferences(selectedCustomer, visibleBookings)

  return {
    firstName: selectedCustomer?.firstName || selectedDemoUser?.displayName?.split(' ')[0] || '',
    lastName: selectedCustomer?.lastName || selectedDemoUser?.displayName?.split(' ').slice(1).join(' ') || '',
    email: selectedCustomer?.email || selectedDemoUser?.email || '',
    phone: selectedCustomer?.phone || '',
    diningPreference: preferences.diningPreference,
    accessibilityNotes: preferences.accessibilityNotes
  }
}

function PassengerProfile({
  selectedCustomer,
  selectedDemoUser,
  visibleBookings = [],
  turnaroundOperations = [],
  isLoadingTurnaroundOperations = false,
  turnaroundOperationsError = '',
  onRetryTurnaroundOperations,
  onUpdateTurnaroundTaskStatus,
  onUpdateTurnaroundTaskDetails,
  onCreateTurnaroundTask,
  onCreateTurnaroundTaskUpdate,
  onDeleteTurnaroundTask,
  onUpdateTurnaroundStaffing,
  onUpdateTurnaroundSignoff,
  updatingTurnaroundTaskId = '',
  updatingTurnaroundTaskDetailsId = '',
  creatingTurnaroundTaskId = '',
  creatingTurnaroundTaskUpdateId = '',
  deletingTurnaroundTaskId = '',
  updatingTurnaroundStaffingKey = '',
  updatingTurnaroundSignoffKey = '',
  creatingTurnaroundEscalationId = '',
  updatingTurnaroundEscalationId = '',
  turnaroundMutationStatus = '',
  turnaroundMutationError = '',
  onSavePassengerProfile,
  savingCustomerId = '',
  mutationError = '',
  cruiseLines = [],
  onBookingCreated
}) {
  const [draft, setDraft] = useState(() => buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings))
  const [message, setMessage] = useState('')
  const selectedCustomerId = selectedCustomer?.id || selectedDemoUser?.customerId || ''
  const isSaving = Boolean(selectedCustomerId && savingCustomerId === selectedCustomerId)

  useEffect(() => {
    setDraft(buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings))
    setMessage('')
  }, [selectedCustomerId, selectedDemoUser?.id])

  function updateDraft(fieldName, value) {
    setDraft(current => ({ ...current, [fieldName]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!selectedCustomerId) {
      setMessage('A customer profile is required before saving passenger preferences.')
      return
    }

    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()) {
      setMessage('First name, last name, and email are required before saving profile changes.')
      return
    }

    setMessage('Saving profile...')

    try {
      const response = await onSavePassengerProfile?.(selectedCustomerId, draft)
      setMessage(response?.message || 'Passenger profile updated successfully')
    } catch (error) {
      setMessage(error.message || mutationError || 'Could not save profile.')
    }
  }

  return (
    <section className="role-profile-card passenger-self-service" aria-labelledby="react-passenger-profile-heading" data-testid="react-passenger-self-service-panel">
      <h3 id="react-passenger-profile-heading">My travel profile</h3>
      <p>Passengers can update limited contact and cruise preference information for the demo booking experience.</p>

      <form className="passenger-profile-form react-passenger-profile-form" onSubmit={handleSubmit} data-testid="react-passenger-profile-form">
        <label>
          <span>First name</span>
          <input name="firstName" aria-label="First name" value={draft.firstName} required onChange={event => updateDraft('firstName', event.target.value)} data-testid="react-passenger-profile-first-name" />
        </label>
        <label>
          <span>Last name</span>
          <input name="lastName" aria-label="Last name" value={draft.lastName} required onChange={event => updateDraft('lastName', event.target.value)} data-testid="react-passenger-profile-last-name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" aria-label="Email" type="email" value={draft.email} required onChange={event => updateDraft('email', event.target.value)} data-testid="react-passenger-profile-email" />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" aria-label="Phone" value={draft.phone} onChange={event => updateDraft('phone', event.target.value)} data-testid="react-passenger-profile-phone" />
        </label>
        <label>
          <span>Dining preference</span>
          <select name="diningPreference" aria-label="Dining preference" value={draft.diningPreference} onChange={event => updateDraft('diningPreference', event.target.value)} data-testid="react-dining-preference-select">
            <option value="Anytime dining">Anytime dining</option>
            <option value="Early seating">Early seating</option>
            <option value="Late seating">Late seating</option>
          </select>
        </label>
        <label>
          <span>Accessibility notes</span>
          <input name="accessibilityNotes" aria-label="Accessibility notes" value={draft.accessibilityNotes} onChange={event => updateDraft('accessibilityNotes', event.target.value)} data-testid="react-passenger-profile-accessibility-notes" />
        </label>

        <button type="submit" className="primary-action-button" disabled={isSaving} data-testid="react-passenger-profile-submit-button">
          {isSaving ? 'Saving profile...' : 'Save profile'}
        </button>
        <p className="draft-message" role="status" aria-live="polite" data-testid="react-passenger-profile-message">
          {message || mutationError || 'Profile changes will be announced here.'}
        </p>
      </form>
    </section>
  )
}

function getActivityFavoriteKey(dayKey, activity = {}) {
  return `${dayKey}::${activity.id || activity.time || activity.activity || activity.name || 'activity'}`
}

function RoleBookingDetails({ booking, favoriteActivityKeys, favoritesOnly, onToggleFavorite, onToggleFavoritesOnly }) {
  const passengers = getVisiblePassengerRows(booking)
  const itineraryDays = getBookingItineraryDays(booking)
  const visibleItineraryDays = favoritesOnly
    ? itineraryDays.filter(day => {
      const dayKey = String(day.id || day.day || day.title)
      return getItineraryDayActivities(day).some(activity => favoriteActivityKeys.has(getActivityFavoriteKey(dayKey, activity)))
    })
    : itineraryDays

  return (
    <section className="role-booking-detail-panel" aria-label={`Details for ${getBookingCardTitle(booking)}`} data-testid="react-role-booking-details">
      <div className="role-booking-detail-grid">
        <div className="role-detail-card">
          <h4>Booking details</h4>
          <dl className="role-booking-fields compact-fields">
            {getBookingCardFields(booking).map(([label, value]) => (
              <div key={`${booking.id}-detail-${label}`}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="role-detail-card">
          <h4>Passenger manifest</h4>
          {passengers.length === 0 ? (
            <p>No visible passengers for this booking.</p>
          ) : passengers.map(passenger => (
            <div key={`${booking.id}-detail-${passenger.id}`} className="visible-passenger-row" data-testid="react-role-detail-passenger-row">
              <span>{passenger.name}</span>
              <span>{passenger.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="role-itinerary-panel">
        <div className="role-itinerary-heading">
          <div>
            <h4>Cruise itinerary</h4>
            <p>Passengers can review port days, activities, and save favorite itinerary activities.</p>
          </div>
          <label className="react-checkbox-label role-favorites-filter">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={onToggleFavoritesOnly}
              data-testid="react-role-favorites-only-toggle"
            />
            <span>Show favorites only</span>
          </label>
        </div>

        {itineraryDays.length === 0 ? (
          <p className="status-card compact" data-testid="react-role-no-itinerary">No itinerary details are available for this booking yet.</p>
        ) : visibleItineraryDays.length === 0 ? (
          <p className="status-card compact" data-testid="react-role-no-favorite-itinerary">No favorite itinerary activities selected yet.</p>
        ) : (
          <div className="role-itinerary-list">
            {visibleItineraryDays.map(day => {
              const dayKey = String(day.id || day.day || day.title)
              const activities = getItineraryDayActivities(day)
              const visibleActivities = favoritesOnly
                ? activities.filter(activity => favoriteActivityKeys.has(getActivityFavoriteKey(dayKey, activity)))
                : activities

              return (
                <article className="role-itinerary-day" key={`${booking.id}-${dayKey}`} data-testid="react-role-itinerary-day">
                  <div className="role-itinerary-day-heading">
                    <div>
                      <h5>Day {day.day || '?'} — {day.title || 'Itinerary day'}</h5>
                      <p>{day.port || 'Port to be announced'}</p>
                    </div>
                  </div>

                  {activities.length === 0 ? (
                    <p>No scheduled activities yet.</p>
                  ) : (
                    <ul className="role-activity-list">
                      {visibleActivities.map(activity => {
                        const activityKey = getActivityFavoriteKey(dayKey, activity)

                        return (
                          <li key={`${dayKey}-${activity.id || activity.time || activity.activity}`} data-testid="react-role-itinerary-activity">
                            <div>
                              <strong>{activity.time || 'Time TBD'}</strong>
                              <span>{activity.activity || activity.name || 'Activity to be announced'}</span>
                            </div>
                            <label className="react-checkbox-label role-favorite-activity-toggle">
                              <input
                                type="checkbox"
                                checked={favoriteActivityKeys.has(activityKey)}
                                onChange={() => onToggleFavorite(activityKey)}
                                data-testid="react-role-favorite-itinerary-toggle"
                              />
                              <span>Favorite activity</span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}


const COMMAND_READINESS_OPTIONS = [
  'Standard coordination',
  'High coordination',
  'Boarding ready',
  'Department handoff watch',
  'Blocked by dependency',
  'Final inspection required'
]


const OPERATIONAL_DIRECTORY_ROLES = [
  { role: 'turnaround-manager', label: 'Turnaround Manager' },
  { role: 'housekeeping-lead', label: 'Housekeeping Lead' },
  { role: 'guest-services-lead', label: 'Guest Services Lead' },
  { role: 'food-beverage-lead', label: 'Food & Beverage Lead' },
  { role: 'engineering-lead', label: 'Engineering Lead' }
]

function normalizeOperationalRoleName(role = '') {
  return String(role).toLowerCase().replaceAll('_', '-')
}

function getOperationalRoleLabel(role = '') {
  const normalizedRole = normalizeOperationalRoleName(role)
  return OPERATIONAL_DIRECTORY_ROLES.find(item => item.role === normalizedRole)?.label || role
}

function buildOperationalDirectory(readinessOperations = []) {
  const entries = OPERATIONAL_DIRECTORY_ROLES.map(({ role, label }) => ({
    role,
    label,
    leadNames: new Set(),
    taskCount: 0,
    blockedTasks: 0,
    activeEscalations: 0,
    handoffCount: 0,
    blockedHandoffs: 0,
    plannedCount: 0,
    checkedInCount: 0,
    signoffStatuses: new Set(),
    musterLocations: new Set()
  }))

  const byRole = new Map(entries.map(entry => [entry.role, entry]))

  readinessOperations.forEach(operation => {
    ;(operation.staffing || []).forEach(staffing => {
      const role = normalizeOperationalRoleName(staffing.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (staffing.leadName) entry.leadNames.add(staffing.leadName)
      if (staffing.musterLocation) entry.musterLocations.add(staffing.musterLocation)
      entry.plannedCount += Number(staffing.plannedCount || 0)
      entry.checkedInCount += Number(staffing.checkedInCount || 0)
    })

    ;(operation.tasks || []).forEach(task => {
      const role = normalizeOperationalRoleName(task.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (task.ownerName) entry.leadNames.add(task.ownerName)
      entry.taskCount += 1
      if (String(task.status || '').toUpperCase() === 'BLOCKED') entry.blockedTasks += 1
    })

    ;(operation.escalations || []).forEach(escalation => {
      const role = normalizeOperationalRoleName(escalation.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (escalation.ownerName) entry.leadNames.add(escalation.ownerName)
      if (!['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())) {
        entry.activeEscalations += 1
      }
    })

    ;(operation.handoffs || []).forEach(handoff => {
      const roles = [
        normalizeOperationalRoleName(handoff.fromDepartmentRole),
        normalizeOperationalRoleName(handoff.toDepartmentRole)
      ]

      roles.forEach(role => {
        const entry = byRole.get(role)
        if (!entry) return

        if (handoff.ownerName) entry.leadNames.add(handoff.ownerName)
        entry.handoffCount += 1
        if (String(handoff.status || '').toUpperCase() === 'BLOCKED') entry.blockedHandoffs += 1
      })
    })

    ;(operation.signoffs || []).forEach(signoff => {
      const role = normalizeOperationalRoleName(signoff.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (signoff.approverName) entry.leadNames.add(signoff.approverName)
      if (signoff.status) entry.signoffStatuses.add(signoff.status)
    })
  })

  return entries.map(entry => ({
    ...entry,
    leadNames: [...entry.leadNames].slice(0, 3),
    musterLocations: [...entry.musterLocations].slice(0, 2),
    signoffStatuses: [...entry.signoffStatuses],
    staffingPercent: entry.plannedCount > 0 ? Math.round((entry.checkedInCount / entry.plannedCount) * 100) : 0
  }))
}


function OperationalTurnaroundDashboard({ roleView, selectedDemoUser, turnaroundOperations = [], isLoading = false, error = '', onRetry, onUpdateOperationCommand, onUpdateTaskStatus, onUpdateTaskDetails, onCreateTask, onCreateTaskUpdate, onDeleteTask, onUpdateStaffing, onUpdateSignoff, onCreateEscalation, onUpdateEscalation, onUpdateHandoff, updatingOperationId = '', updatingTaskId = '', updatingTaskDetailsId = '', creatingTaskId = '', creatingTaskUpdateId = '', deletingTaskId = '', updatingStaffingKey = '', updatingSignoffKey = '', creatingEscalationId = '', updatingEscalationId = '', updatingHandoffId = '', mutationStatus = '', mutationError = '' }) {
  const readinessOperations = useMemo(() => buildTurnaroundOperationCards(turnaroundOperations, roleView), [turnaroundOperations, roleView])
  const [selectedTurnaroundId, setSelectedTurnaroundId] = useState('')

  useEffect(() => {
    if (readinessOperations.length === 0) {
      if (selectedTurnaroundId) setSelectedTurnaroundId('')
      return
    }

    if (!readinessOperations.some(operation => operation.id === selectedTurnaroundId)) {
      setSelectedTurnaroundId(readinessOperations[0].id)
    }
  }, [readinessOperations, selectedTurnaroundId])

  const selectedOperation = readinessOperations.find(operation => operation.id === selectedTurnaroundId) || readinessOperations[0]
  const visibleReadinessOperations = selectedOperation ? [selectedOperation] : []
  const operationalDirectory = useMemo(() => buildOperationalDirectory(visibleReadinessOperations), [visibleReadinessOperations])
  const highCoordinationCount = visibleReadinessOperations.filter(item => String(item.readinessLevel).toLowerCase().includes('high')).length
  const passengerTotal = selectedOperation?.passengerCount || 0
  const focusLine = selectedOperation?.tasks?.[0]?.taskName || getOperationalRoleFocus(roleView)
  const [activeOperationsWorkspace, setActiveOperationsWorkspace] = useState('overview')
  const operationsWorkspaceTabs = [
    { id: 'overview', label: 'Overview', summary: 'Command plan, selected sailing context, and cross-department directory.' },
    { id: 'tasks', label: 'Tasks', summary: 'Role-focused task checklist, follow-up tasks, blocker notes, and shift updates.' },
    { id: 'dependencies', label: 'Dependencies', summary: 'Gates that must clear before embarkation or department release work can continue.' },
    { id: 'handoffs', label: 'Handoffs', summary: 'Department-to-department release workflow, owners, due times, and notes.' },
    { id: 'escalations', label: 'Escalations', summary: 'Open operational risks, owners, severity, monitoring, and resolution state.' },
    { id: 'staffing', label: 'Staffing', summary: 'Crew check-in, department leads, muster locations, and coverage gaps.' },
    { id: 'readiness', label: 'Readiness', summary: 'Department signoffs and final readiness approval workflow.' }
  ]
  const activeOperationsWorkspaceDetails = operationsWorkspaceTabs.find(tab => tab.id === activeOperationsWorkspace) || operationsWorkspaceTabs[0]
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedDependencyId, setSelectedDependencyId] = useState('')
  const [selectedHandoffId, setSelectedHandoffId] = useState('')
  const [operationCommandDrafts, setOperationCommandDrafts] = useState({})
  const [taskDetailDrafts, setTaskDetailDrafts] = useState({})
  const [taskCreateDrafts, setTaskCreateDrafts] = useState({})
  const [taskUpdateDrafts, setTaskUpdateDrafts] = useState({})
  const [signoffDrafts, setSignoffDrafts] = useState({})
  const [staffingDrafts, setStaffingDrafts] = useState({})
  const [escalationCreateDrafts, setEscalationCreateDrafts] = useState({})
  const [escalationUpdateDrafts, setEscalationUpdateDrafts] = useState({})
  const [handoffDrafts, setHandoffDrafts] = useState({})
  const selectedOperationTasks = selectedOperation?.tasks || []
  const selectedOperationDependencies = selectedOperation?.taskDependencies || []
  const selectedOperationHandoffs = selectedOperation?.handoffs || []
  const selectedDependency = selectedOperationDependencies.find(dependency => (dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`) === selectedDependencyId) || selectedOperationDependencies[0]
  const selectedDependencyKey = selectedDependency?.id || (selectedDependency ? `${selectedDependency.taskName}:${selectedDependency.dependsOnTaskName}` : '')
  const dependencyWorkspaceSummary = selectedOperation?.dependencySummary || {
    totalDependencies: selectedOperationDependencies.length,
    activeDependencies: selectedOperationDependencies.filter(dependency => dependency.status !== 'CLEARED').length,
    clearedDependencies: selectedOperationDependencies.filter(dependency => dependency.status === 'CLEARED').length
  }
  const selectedHandoff = selectedOperationHandoffs.find(handoff => handoff.id === selectedHandoffId) || selectedOperationHandoffs[0]
  const selectedHandoffKey = selectedHandoff?.id || ''
  const handoffWorkspaceSummary = selectedOperation?.handoffSummary || {
    totalHandoffs: selectedOperationHandoffs.length,
    completedHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status === 'COMPLETE').length,
    blockedHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status === 'BLOCKED').length,
    pendingHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status !== 'COMPLETE').length
  }
  const selectedTask = selectedOperationTasks.find(task => (task.id || task.taskName) === selectedTaskId) || selectedOperationTasks[0]
  const selectedTaskKey = selectedTask?.id || selectedTask?.taskName || ''
  const taskWorkspaceSummary = selectedOperation?.taskSummary || {
    totalTasks: selectedOperationTasks.length,
    completeTasks: selectedOperationTasks.filter(task => task.status === 'COMPLETE').length,
    blockedTasks: selectedOperationTasks.filter(task => task.status === 'BLOCKED').length,
    completionPercent: selectedOperationTasks.length > 0
      ? Math.round((selectedOperationTasks.filter(task => task.status === 'COMPLETE').length / selectedOperationTasks.length) * 100)
      : 0
  }

  useEffect(() => {
    if (selectedOperationTasks.length === 0) {
      if (selectedTaskId) setSelectedTaskId('')
      return
    }

    if (!selectedOperationTasks.some(task => (task.id || task.taskName) === selectedTaskId)) {
      setSelectedTaskId(selectedOperationTasks[0].id || selectedOperationTasks[0].taskName)
    }
  }, [selectedOperation?.id, selectedOperationTasks, selectedTaskId])

  useEffect(() => {
    if (selectedOperationDependencies.length === 0) {
      if (selectedDependencyId) setSelectedDependencyId('')
      return
    }

    if (!selectedOperationDependencies.some(dependency => (dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`) === selectedDependencyId)) {
      const firstDependency = selectedOperationDependencies[0]
      setSelectedDependencyId(firstDependency.id || `${firstDependency.taskName}:${firstDependency.dependsOnTaskName}`)
    }
  }, [selectedOperation?.id, selectedOperationDependencies, selectedDependencyId])



  useEffect(() => {
    if (selectedOperationHandoffs.length === 0) {
      if (selectedHandoffId) setSelectedHandoffId('')
      return
    }

    if (!selectedOperationHandoffs.some(handoff => handoff.id === selectedHandoffId)) {
      setSelectedHandoffId(selectedOperationHandoffs[0].id)
    }
  }, [selectedOperation?.id, selectedOperationHandoffs, selectedHandoffId])



  function getOperationCommandDraft(operationCard) {
    return operationCommandDrafts[operationCard.id] || {
      status: operationCard.commandStatus || operationCard.status || 'PLANNED',
      readinessLevel: operationCard.commandReadinessLevel || operationCard.readinessLevel || 'Standard coordination',
      port: operationCard.port || operationCard.arrivalPort || '',
      notes: operationCard.notes || ''
    }
  }

  function updateOperationCommandDraft(operationCard, fieldName, value) {
    setOperationCommandDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getOperationCommandDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveOperationCommand(operationCard) {
    const draft = getOperationCommandDraft(operationCard)
    const response = await onUpdateOperationCommand?.(operationCard.id, draft)

    if (response) {
      setOperationCommandDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }


  function getEscalationCreateDraft(operationCard) {
    return escalationCreateDrafts[operationCard.id] || {
      departmentRole: roleView,
      severity: 'WATCH',
      title: '',
      ownerName: selectedDemoUser?.displayName || '',
      status: 'OPEN',
      resolutionNotes: ''
    }
  }

  function updateEscalationCreateDraft(operationCard, fieldName, value) {
    setEscalationCreateDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getEscalationCreateDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveEscalationCreate(operationCard) {
    const draft = getEscalationCreateDraft(operationCard)
    const response = await onCreateEscalation?.(operationCard.id, draft)

    if (response) {
      setEscalationCreateDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }

  function getEscalationUpdateDraft(escalation) {
    return escalationUpdateDrafts[escalation.id] || {
      severity: escalation.severity || 'WATCH',
      title: escalation.title || '',
      ownerName: escalation.ownerName || '',
      status: escalation.status || 'OPEN',
      resolutionNotes: escalation.resolutionNotes || ''
    }
  }

  function updateEscalationDraft(escalation, fieldName, value) {
    setEscalationUpdateDrafts(current => ({
      ...current,
      [escalation.id]: {
        ...getEscalationUpdateDraft(escalation),
        [fieldName]: value
      }
    }))
  }

  async function saveEscalationUpdate(escalation) {
    const draft = getEscalationUpdateDraft(escalation)
    const response = await onUpdateEscalation?.(escalation.id, draft)

    if (response) {
      setEscalationUpdateDrafts(current => {
        const next = { ...current }
        delete next[escalation.id]
        return next
      })
    }
  }


  function getHandoffDraft(handoff) {
    return handoffDrafts[handoff.id] || {
      status: handoff.status || 'PENDING',
      ownerName: handoff.ownerName || selectedDemoUser?.displayName || '',
      dueTime: handoff.dueTime || '',
      notes: handoff.notes || ''
    }
  }

  function updateHandoffDraft(handoff, fieldName, value) {
    setHandoffDrafts(current => ({
      ...current,
      [handoff.id]: {
        ...getHandoffDraft(handoff),
        [fieldName]: value
      }
    }))
  }

  async function saveHandoffUpdate(handoff) {
    const response = await onUpdateHandoff?.(handoff.id, getHandoffDraft(handoff))

    if (response) {
      setHandoffDrafts(current => {
        const next = { ...current }
        delete next[handoff.id]
        return next
      })
    }
  }


  function getRoleStaffing(operationCard) {
    return (operationCard.staffing || []).find(staffing => staffing.departmentRole === roleView) || {
      departmentRole: roleView,
      plannedCount: 0,
      checkedInCount: 0,
      leadName: selectedDemoUser?.displayName || '',
      musterLocation: '',
      notes: ''
    }
  }

  function getStaffingDraft(operationCard) {
    const existingStaffing = getRoleStaffing(operationCard)

    return staffingDrafts[operationCard.id] || {
      plannedCount: String(existingStaffing.plannedCount ?? 0),
      checkedInCount: String(existingStaffing.checkedInCount ?? 0),
      leadName: existingStaffing.leadName || selectedDemoUser?.displayName || '',
      musterLocation: existingStaffing.musterLocation || '',
      notes: existingStaffing.notes || ''
    }
  }

  function updateStaffingDraft(operationCard, fieldName, value) {
    setStaffingDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getStaffingDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveStaffing(operationCard) {
    const draft = getStaffingDraft(operationCard)
    const payload = {
      ...draft,
      plannedCount: Number(draft.plannedCount || 0),
      checkedInCount: Number(draft.checkedInCount || 0)
    }
    const response = await onUpdateStaffing?.(operationCard.id, roleView, payload)

    if (response) {
      setStaffingDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }

  function getRoleSignoff(operationCard) {
    return (operationCard.signoffs || []).find(signoff => signoff.departmentRole === roleView) || {
      departmentRole: roleView,
      approverName: selectedDemoUser?.displayName || '',
      status: 'PENDING',
      notes: ''
    }
  }

  function getSignoffDraft(operationCard) {
    const existingSignoff = getRoleSignoff(operationCard)

    return signoffDrafts[operationCard.id] || {
      approverName: existingSignoff.approverName || selectedDemoUser?.displayName || '',
      status: existingSignoff.status || 'PENDING',
      notes: existingSignoff.notes || ''
    }
  }

  function updateSignoffDraft(operationCard, fieldName, value) {
    setSignoffDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getSignoffDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveSignoff(operationCard) {
    const draft = getSignoffDraft(operationCard)
    const response = await onUpdateSignoff?.(operationCard.id, roleView, draft)

    if (response) {
      setSignoffDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }


  function getTaskCreateDraft(operationCard) {
    return taskCreateDrafts[operationCard.id] || {
      departmentRole: roleView,
      taskName: '',
      ownerName: selectedDemoUser?.displayName || '',
      dueTime: '',
      location: '',
      blockerReason: ''
    }
  }

  function updateTaskCreateDraft(operationCard, fieldName, value) {
    setTaskCreateDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getTaskCreateDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveTaskCreate(operationCard) {
    const draft = getTaskCreateDraft(operationCard)
    const response = await onCreateTask?.(operationCard.id, {
      ...draft,
      status: 'READY'
    })

    if (response) {
      setTaskCreateDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }

  function getTaskDetailDraft(task) {
    return taskDetailDrafts[task.id] || {
      ownerName: task.ownerName || '',
      dueTime: task.dueTime || '',
      location: task.location || '',
      blockerReason: task.blockerReason || ''
    }
  }

  function updateTaskDetailDraft(task, fieldName, value) {
    setTaskDetailDrafts(current => {
      const existingDraft = current[task.id] || {
        ownerName: task.ownerName || '',
        dueTime: task.dueTime || '',
        location: task.location || '',
        blockerReason: task.blockerReason || ''
      }

      return {
        ...current,
        [task.id]: {
          ...existingDraft,
          [fieldName]: value
        }
      }
    })
  }

  async function saveTaskDetails(task) {
    const draft = getTaskDetailDraft(task)
    const response = await onUpdateTaskDetails?.(task.id, draft)

    if (response) {
      setTaskDetailDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
  }

  function updateStatus(task, status) {
    const draft = getTaskDetailDraft(task)
    return onUpdateTaskStatus?.(task.id, status, { blockerReason: draft.blockerReason })
  }

  function getTaskUpdateDraft(task) {
    return taskUpdateDrafts[task.id] || ''
  }

  function updateTaskUpdateDraft(task, value) {
    setTaskUpdateDrafts(current => ({
      ...current,
      [task.id]: value
    }))
  }

  async function saveTaskUpdate(task) {
    const message = getTaskUpdateDraft(task).trim()
    if (!message) return

    const response = await onCreateTaskUpdate?.(task.id, {
      authorName: selectedDemoUser?.displayName || 'Operational lead',
      updateType: 'NOTE',
      message
    })

    if (response) {
      setTaskUpdateDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
  }

  async function removeTask(task) {
    const response = await onDeleteTask?.(task.id)

    if (response) {
      setTaskDetailDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
      setTaskUpdateDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
  }

  return (
    <section className="operational-turnaround-panel" aria-labelledby="operational-turnaround-heading" data-testid="react-operational-turnaround-panel">
      <div className="operational-turnaround-hero">
        <div>
          <p className="eyebrow">Turnaround readiness</p>
          <h3 id="operational-turnaround-heading">{focusLine}</h3>
          <p>
            {selectedDemoUser?.displayName || 'This operator'} is reviewing database-backed turnaround plans, readiness tasks, and sailing context without exposing admin-only mutation controls.
          </p>
        </div>
        <dl className="operational-metric-grid" aria-label="Turnaround readiness metrics">
          <div data-testid="react-operational-readiness-bookings">
            <dt>Turnaround plans</dt>
            <dd>{readinessOperations.length}</dd>
          </div>
          <div data-testid="react-operational-readiness-passengers">
            <dt>Passengers visible</dt>
            <dd>{passengerTotal}</dd>
          </div>
          <div data-testid="react-operational-readiness-alerts">
            <dt>High coordination</dt>
            <dd>{highCoordinationCount}</dd>
          </div>
        </dl>
      </div>

      {readinessOperations.length > 1 && selectedOperation && (
        <section className="turnaround-selector-panel" aria-labelledby="turnaround-selector-heading" data-testid="react-turnaround-selector-panel">
          <div>
            <p className="eyebrow">Selected turnaround</p>
            <h4 id="turnaround-selector-heading">Focus one sailing at a time</h4>
            <p>Choose a sailing to keep the command center readable. Tasks, handoffs, staffing, dependencies, and escalations below stay scoped to the selected turnaround.</p>
          </div>
          <label className="turnaround-selector-control">
            <span>Turnaround sailing</span>
            <select
              value={selectedOperation.id}
              onChange={event => setSelectedTurnaroundId(event.target.value)}
              aria-label="Select turnaround sailing"
              data-testid="react-turnaround-selector"
            >
              {readinessOperations.map(operation => (
                <option value={operation.id} key={operation.id}>
                  {operation.title} — {operation.shipName} — {operation.sailingDate}
                </option>
              ))}
            </select>
          </label>
          <dl className="turnaround-selector-summary" aria-label="Selected turnaround summary" data-testid="react-turnaround-selector-summary">
            <div>
              <dt>Status</dt>
              <dd>{selectedOperation.commandStatus || selectedOperation.status}</dd>
            </div>
            <div>
              <dt>Port</dt>
              <dd>{selectedOperation.port || selectedOperation.arrivalPort}</dd>
            </div>
            <div>
              <dt>Tasks</dt>
              <dd>{selectedOperation.taskSummary?.totalTasks || selectedOperation.tasks?.length || 0}</dd>
            </div>
            <div>
              <dt>Blockers</dt>
              <dd>{selectedOperation.taskSummary?.blockedTasks || 0}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="operations-workspace-shell" aria-labelledby="operations-workspace-heading" data-testid="react-operations-workspace-shell">
        <div className="operations-workspace-heading">
          <p className="eyebrow">Operations workspace</p>
          <h4 id="operations-workspace-heading">Focus by operational workstream</h4>
          <p>Select a workstream to orient the command center around the job the role is trying to complete. This is the navigation foundation for the focused workspaces coming next.</p>
        </div>
        <nav className="operations-workspace-nav" aria-label="Turnaround operations workstreams" data-testid="react-operations-workspace-nav">
          {operationsWorkspaceTabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              className={`operations-workspace-nav-button${activeOperationsWorkspace === tab.id ? ' active' : ''}`}
              aria-pressed={activeOperationsWorkspace === tab.id}
              onClick={() => setActiveOperationsWorkspace(tab.id)}
              data-testid={`react-operations-workspace-${tab.id}-button`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="operations-workspace-active-summary" data-testid="react-operations-workspace-active-summary">
          <strong>{activeOperationsWorkspaceDetails.label}</strong>
          <span>{activeOperationsWorkspaceDetails.summary}</span>
        </div>
      </section>

      {operationalDirectory.length > 0 && (
        <section className="operations-directory-panel" aria-labelledby="operations-directory-heading" data-testid="react-operations-directory-panel">
          <div className="operations-directory-heading">
            <div>
              <p className="eyebrow">Operations directory</p>
              <h4 id="operations-directory-heading">Department contacts and active workload</h4>
              <p>Fast cross-department visibility for leads, staffing coverage, handoffs, blockers, and escalation ownership across the visible turnaround plans.</p>
            </div>
            <span className="operations-directory-count" data-testid="react-operations-directory-count">{operationalDirectory.length} departments</span>
          </div>
          <div className="operations-directory-grid" aria-label="Operational department directory">
            {operationalDirectory.map(entry => (
              <article className={`operations-directory-card${entry.role === roleView ? ' active' : ''}`} key={entry.role} data-testid="react-operations-directory-card">
                <div className="operations-directory-card-header">
                  <div>
                    <p className="eyebrow">{entry.role === roleView ? 'Current role' : 'Partner role'}</p>
                    <h5>{entry.label}</h5>
                  </div>
                  <span>{entry.staffingPercent}% staffed</span>
                </div>
                <dl className="operations-directory-metrics">
                  <div>
                    <dt>Tasks</dt>
                    <dd>{entry.taskCount}</dd>
                  </div>
                  <div>
                    <dt>Blocked</dt>
                    <dd>{entry.blockedTasks + entry.blockedHandoffs}</dd>
                  </div>
                  <div>
                    <dt>Handoffs</dt>
                    <dd>{entry.handoffCount}</dd>
                  </div>
                  <div>
                    <dt>Escalations</dt>
                    <dd>{entry.activeEscalations}</dd>
                  </div>
                </dl>
                <div className="operations-directory-contact">
                  <strong>Contacts</strong>
                  <p>{entry.leadNames.length ? entry.leadNames.join(', ') : 'Lead assignment pending'}</p>
                </div>
                <div className="operations-directory-contact">
                  <strong>Muster / coordination</strong>
                  <p>{entry.musterLocations.length ? entry.musterLocations.join(', ') : 'Location pending'}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {mutationStatus && <p className="status-card compact" data-testid="react-operational-mutation-status">{mutationStatus}</p>}
      {mutationError && <p className="status-card compact error" data-testid="react-operational-mutation-error">{mutationError}</p>}

      {isLoading ? (
        <p className="status-card compact" data-testid="react-operational-loading-state">Loading turnaround operations from the database...</p>
      ) : error ? (
        <div className="status-card compact" data-testid="react-operational-error-state">
          <p>{error}</p>
          <button type="button" className="secondary-action-button" onClick={onRetry}>Retry turnaround data</button>
        </div>
      ) : readinessOperations.length === 0 ? (
        <p className="status-card compact" data-testid="react-operational-empty-state">No turnaround operation records are available yet.</p>
      ) : activeOperationsWorkspace === 'dependencies' && selectedOperation ? (
        <section className="operations-dependency-workspace" aria-labelledby="operations-dependency-workspace-heading" data-testid="react-operations-dependency-workspace">
          <div className="operations-dependency-workspace-header">
            <div>
              <p className="eyebrow">Slice 4 dependency workspace</p>
              <h4 id="operations-dependency-workspace-heading">Dependency gates for {selectedOperation.title}</h4>
              <p>Review blocker gates as a dedicated release queue. Select one dependency to see the blocked task, prerequisite task, status, notes, and operational impact without crowding the main overview.</p>
            </div>
            <dl className="operations-dependency-workspace-metrics" aria-label="Selected turnaround dependency summary" data-testid="react-operations-dependency-workspace-summary">
              <div>
                <dt>Total</dt>
                <dd>{dependencyWorkspaceSummary.totalDependencies || selectedOperationDependencies.length}</dd>
              </div>
              <div>
                <dt>Active</dt>
                <dd>{dependencyWorkspaceSummary.activeDependencies || 0}</dd>
              </div>
              <div>
                <dt>Cleared</dt>
                <dd>{dependencyWorkspaceSummary.clearedDependencies || 0}</dd>
              </div>
            </dl>
          </div>

          {selectedOperationDependencies.length === 0 ? (
            <p className="status-card compact" data-testid="react-operations-dependency-empty-state">No dependency gates are assigned to this selected turnaround yet.</p>
          ) : (
            <div className="operations-dependency-layout">
              <div className="operations-dependency-list-panel" aria-label="Turnaround dependency gate queue">
                <div className="operations-dependency-list-heading">
                  <h5>Dependency gates</h5>
                  <span>{selectedOperationDependencies.length} gate{selectedOperationDependencies.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-dependency-list" data-testid="react-operations-dependency-list">
                  {selectedOperationDependencies.map(dependency => {
                    const dependencyKey = dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`
                    const isSelected = dependencyKey === selectedDependencyKey

                    return (
                      <li key={dependencyKey}>
                        <button
                          type="button"
                          className={`operations-dependency-list-item${isSelected ? ' active' : ''}${dependency.status === 'ACTIVE' ? ' active-gate' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedDependencyId(dependencyKey)}
                          data-testid="react-operations-dependency-list-item"
                        >
                          <span className={`operations-dependency-status-pill ${String(dependency.status).toLowerCase()}`}>{dependency.status}</span>
                          <strong>{dependency.taskName}</strong>
                          <span>Depends on {dependency.dependsOnTaskName}</span>
                          {dependency.notes && <small>{dependency.notes}</small>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedDependency && (
                <article className="operations-dependency-detail-panel" aria-label={`Dependency details for ${selectedDependency.taskName}`} data-testid="react-operations-dependency-detail-panel">
                  <div className="operations-dependency-detail-header">
                    <div>
                      <p className="eyebrow">Focused dependency</p>
                      <h5>{selectedDependency.taskName}</h5>
                    </div>
                    <span className={`operations-dependency-status-pill ${String(selectedDependency.status).toLowerCase()}`}>{selectedDependency.status}</span>
                  </div>

                  <dl className="operations-dependency-detail-list" data-testid="react-operations-dependency-detail-list">
                    <div>
                      <dt>Blocked task</dt>
                      <dd>{selectedDependency.taskName}</dd>
                    </div>
                    <div>
                      <dt>Required first</dt>
                      <dd>{selectedDependency.dependsOnTaskName}</dd>
                    </div>
                    <div>
                      <dt>Gate type</dt>
                      <dd>{selectedDependency.dependencyType || 'BLOCKS'}</dd>
                    </div>
                    <div>
                      <dt>Gate status</dt>
                      <dd>{selectedDependency.status}</dd>
                    </div>
                  </dl>

                  {selectedDependency.notes && (
                    <div className="operations-dependency-note" data-testid="react-operations-dependency-note">
                      <strong>Operational note</strong>
                      <p>{selectedDependency.notes}</p>
                    </div>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : activeOperationsWorkspace === 'handoffs' && selectedOperation ? (
        <section className="operations-handoff-workspace" aria-labelledby="operations-handoff-workspace-heading" data-testid="react-operations-handoff-workspace">
          <div className="operations-handoff-workspace-header">
            <div>
              <p className="eyebrow">Slice 5 handoff workspace</p>
              <h4 id="operations-handoff-workspace-heading">Department handoffs for {selectedOperation.title}</h4>
              <p>Work one release handoff at a time. The queue keeps ownership, due time, sender, receiver, status, and notes readable without showing every handoff form in the overview.</p>
            </div>
            <dl className="operations-handoff-workspace-metrics" aria-label="Selected turnaround handoff summary" data-testid="react-operations-handoff-workspace-summary">
              <div>
                <dt>Total</dt>
                <dd>{handoffWorkspaceSummary.totalHandoffs || selectedOperationHandoffs.length}</dd>
              </div>
              <div>
                <dt>Complete</dt>
                <dd>{handoffWorkspaceSummary.completedHandoffs || 0}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>{handoffWorkspaceSummary.blockedHandoffs || 0}</dd>
              </div>
              <div>
                <dt>Open</dt>
                <dd>{handoffWorkspaceSummary.pendingHandoffs ?? Math.max(0, selectedOperationHandoffs.length - (handoffWorkspaceSummary.completedHandoffs || 0))}</dd>
              </div>
            </dl>
          </div>

          {selectedOperationHandoffs.length === 0 ? (
            <p className="status-card compact" data-testid="react-operations-handoff-empty-state">No department handoffs are assigned to this selected turnaround yet.</p>
          ) : (
            <div className="operations-handoff-layout">
              <div className="operations-handoff-list-panel" aria-label="Turnaround department handoff queue">
                <div className="operations-handoff-list-heading">
                  <h5>Handoff queue</h5>
                  <span>{selectedOperationHandoffs.length} handoff{selectedOperationHandoffs.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-handoff-list-focused" data-testid="react-operations-handoff-list">
                  {selectedOperationHandoffs.map(handoff => {
                    const isSelected = handoff.id === selectedHandoffKey

                    return (
                      <li key={handoff.id}>
                        <button
                          type="button"
                          className={`operations-handoff-list-item${isSelected ? ' active' : ''}${handoff.status === 'BLOCKED' ? ' blocked' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedHandoffId(handoff.id)}
                          data-testid="react-operations-handoff-list-item"
                        >
                          <span className={`operations-handoff-status-pill ${String(handoff.status).toLowerCase()}`}>{handoff.status}</span>
                          <strong>{handoff.title}</strong>
                          <span>{handoff.fromDepartmentRole} → {handoff.toDepartmentRole}</span>
                          <small>{handoff.ownerName || 'Owner pending'} · {handoff.dueTime || 'Due pending'}</small>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedHandoff && (
                <article className="operations-handoff-detail-panel" aria-label={`Handoff details for ${selectedHandoff.title}`} data-testid="react-operations-handoff-detail-panel">
                  <div className="operations-handoff-detail-header">
                    <div>
                      <p className="eyebrow">Focused handoff</p>
                      <h5>{selectedHandoff.title}</h5>
                    </div>
                    <span className={`operations-handoff-status-pill ${String(selectedHandoff.status).toLowerCase()}`}>{selectedHandoff.status}</span>
                  </div>

                  <dl className="operations-handoff-detail-list" data-testid="react-operations-handoff-detail-list">
                    <div>
                      <dt>From</dt>
                      <dd>{selectedHandoff.fromDepartmentRole}</dd>
                    </div>
                    <div>
                      <dt>To</dt>
                      <dd>{selectedHandoff.toDepartmentRole}</dd>
                    </div>
                    <div>
                      <dt>Owner</dt>
                      <dd>{selectedHandoff.ownerName || 'Owner pending'}</dd>
                    </div>
                    <div>
                      <dt>Due time</dt>
                      <dd>{selectedHandoff.dueTime || 'Due pending'}</dd>
                    </div>
                  </dl>

                  {selectedHandoff.notes && (
                    <div className="operations-handoff-note" data-testid="react-operations-handoff-note">
                      <strong>Handoff note</strong>
                      <p>{selectedHandoff.notes}</p>
                    </div>
                  )}

                  {onUpdateHandoff && (
                    <form className="operations-handoff-detail-form operational-handoff-form" onSubmit={event => { event.preventDefault(); saveHandoffUpdate(selectedHandoff) }} data-testid="react-operational-handoff-form">
                      <label>
                        <span>Status</span>
                        <select value={getHandoffDraft(selectedHandoff).status} onChange={event => updateHandoffDraft(selectedHandoff, 'status', event.target.value)} aria-label={`${selectedHandoff.title} handoff status`}>
                          <option value="PENDING">Pending</option>
                          <option value="IN_REVIEW">In review</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="COMPLETE">Complete</option>
                        </select>
                      </label>
                      <label>
                        <span>Owner</span>
                        <input value={getHandoffDraft(selectedHandoff).ownerName} onChange={event => updateHandoffDraft(selectedHandoff, 'ownerName', event.target.value)} aria-label={`${selectedHandoff.title} handoff owner`} />
                      </label>
                      <label>
                        <span>Due time</span>
                        <input value={getHandoffDraft(selectedHandoff).dueTime} onChange={event => updateHandoffDraft(selectedHandoff, 'dueTime', event.target.value)} aria-label={`${selectedHandoff.title} handoff due time`} />
                      </label>
                      <label className="full-width-field">
                        <span>Handoff notes</span>
                        <textarea value={getHandoffDraft(selectedHandoff).notes} onChange={event => updateHandoffDraft(selectedHandoff, 'notes', event.target.value)} aria-label={`${selectedHandoff.title} handoff notes`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button" disabled={updatingHandoffId === selectedHandoff.id || !getHandoffDraft(selectedHandoff).ownerName.trim()}>Save handoff</button>
                    </form>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : activeOperationsWorkspace === 'tasks' && selectedOperation ? (
        <section className="operations-task-workspace" aria-labelledby="operations-task-workspace-heading" data-testid="react-operations-task-workspace">
          <div className="operations-task-workspace-header">
            <div>
              <p className="eyebrow">Slice 3 task workspace</p>
              <h4 id="operations-task-workspace-heading">Focused task list for {selectedOperation.title}</h4>
              <p>Review the role checklist as a clean queue. Pick one task to update owner, timing, location, blocker notes, status, and shift updates without exposing every operational workflow at once.</p>
            </div>
            <dl className="operations-task-workspace-metrics" aria-label="Selected turnaround task summary" data-testid="react-operations-task-workspace-summary">
              <div>
                <dt>Total</dt>
                <dd>{taskWorkspaceSummary.totalTasks || selectedOperationTasks.length}</dd>
              </div>
              <div>
                <dt>Complete</dt>
                <dd>{taskWorkspaceSummary.completeTasks || 0}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>{taskWorkspaceSummary.blockedTasks || 0}</dd>
              </div>
              <div>
                <dt>Ready</dt>
                <dd>{taskWorkspaceSummary.completionPercent || 0}%</dd>
              </div>
            </dl>
          </div>

          {onCreateTask && (
            <form className="operations-task-quick-add operational-task-create-form" onSubmit={event => { event.preventDefault(); saveTaskCreate(selectedOperation) }} data-testid="react-operational-task-create-form">
              <div>
                <p className="eyebrow">Add task</p>
                <h5>New turnaround task</h5>
              </div>
              <label>
                <span>Department</span>
                <select value={getTaskCreateDraft(selectedOperation).departmentRole} onChange={event => updateTaskCreateDraft(selectedOperation, 'departmentRole', event.target.value)} aria-label={`${selectedOperation.title} new task department`}>
                  <option value="turnaround-manager">Turnaround Manager</option>
                  <option value="housekeeping-lead">Housekeeping Lead</option>
                  <option value="guest-services-lead">Guest Services Lead</option>
                  <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                  <option value="engineering-lead">Engineering Lead</option>
                </select>
              </label>
              <label className="operations-task-quick-add-name">
                <span>Task name</span>
                <input value={getTaskCreateDraft(selectedOperation).taskName} onChange={event => updateTaskCreateDraft(selectedOperation, 'taskName', event.target.value)} aria-label={`${selectedOperation.title} new task name`} />
              </label>
              <label>
                <span>Owner</span>
                <input value={getTaskCreateDraft(selectedOperation).ownerName} onChange={event => updateTaskCreateDraft(selectedOperation, 'ownerName', event.target.value)} aria-label={`${selectedOperation.title} new task owner`} />
              </label>
              <button type="submit" className="secondary-action-button compact-button" disabled={creatingTaskId === selectedOperation.id || !getTaskCreateDraft(selectedOperation).taskName.trim()}>Add task</button>
            </form>
          )}

          {selectedOperationTasks.length === 0 ? (
            <p className="status-card compact" data-testid="react-operations-task-empty-state">No tasks are assigned to this selected turnaround yet.</p>
          ) : (
            <div className="operations-task-layout">
              <div className="operations-task-list-panel" aria-label="Turnaround task queue">
                <div className="operations-task-list-heading">
                  <h5>Task queue</h5>
                  <span>{selectedOperationTasks.length} task{selectedOperationTasks.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-task-list" data-testid="react-operations-task-list">
                  {selectedOperationTasks.map(task => {
                    const taskKey = task.id || task.taskName
                    const isSelected = taskKey === selectedTaskKey

                    return (
                      <li key={taskKey}>
                        <button
                          type="button"
                          className={`operations-task-list-item${isSelected ? ' active' : ''}${task.status === 'BLOCKED' ? ' blocked' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedTaskId(taskKey)}
                          data-testid="react-operations-task-list-item"
                        >
                          <span className="operations-task-status-pill">{task.status}</span>
                          <strong>{task.taskName}</strong>
                          <span>{task.ownerName || 'Unassigned'} · {task.dueTime || 'Timing pending'}</span>
                          {task.blockerReason && <small>Blocked: {task.blockerReason}</small>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedTask && (
                <article className="operations-task-detail-panel" aria-label={`Task details for ${selectedTask.taskName}`} data-testid="react-operations-task-detail-panel">
                  <div className="operations-task-detail-header">
                    <div>
                      <p className="eyebrow">Focused task</p>
                      <h5>{selectedTask.taskName}</h5>
                    </div>
                    <span className={`operations-task-status-pill ${String(selectedTask.status).toLowerCase()}`}>{selectedTask.status}</span>
                  </div>

                  <dl className="operational-task-detail-list" data-testid="react-operational-task-details">
                    <div>
                      <dt>Owner</dt>
                      <dd>{selectedTask.ownerName || 'Unassigned'}</dd>
                    </div>
                    <div>
                      <dt>Due</dt>
                      <dd>{selectedTask.dueTime || 'Timing pending'}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{selectedTask.location || 'Location pending'}</dd>
                    </div>
                  </dl>
                  {selectedTask.blockerReason && <p className="operational-blocker-note" data-testid="react-operational-blocker-note">Blocked: {selectedTask.blockerReason}</p>}

                  {selectedTask.updates?.length > 0 && (
                    <div className="operational-task-updates" data-testid="react-operational-task-updates">
                      <strong>Shift updates</strong>
                      <ul>
                        {selectedTask.updates.slice(0, 3).map(update => (
                          <li key={update.id}>
                            <span>{update.authorName}</span>
                            <span>{update.updateType || 'NOTE'}</span>
                            <span>{update.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {onCreateTaskUpdate && selectedTask.id && (
                    <form className="operational-task-update-form" onSubmit={event => { event.preventDefault(); saveTaskUpdate(selectedTask) }} data-testid="react-operational-task-update-form">
                      <label className="full-width-field">
                        <span>Shift update</span>
                        <textarea value={getTaskUpdateDraft(selectedTask)} onChange={event => updateTaskUpdateDraft(selectedTask, event.target.value)} aria-label={`${selectedTask.taskName} shift update`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button" disabled={creatingTaskUpdateId === selectedTask.id || !getTaskUpdateDraft(selectedTask).trim()}>Add shift update</button>
                    </form>
                  )}

                  {onUpdateTaskDetails && selectedTask.id && (
                    <form className="operational-task-detail-form operations-task-detail-edit-form" onSubmit={event => { event.preventDefault(); saveTaskDetails(selectedTask) }} data-testid="react-operational-task-detail-form">
                      <label>
                        <span>Owner</span>
                        <input value={getTaskDetailDraft(selectedTask).ownerName} onChange={event => updateTaskDetailDraft(selectedTask, 'ownerName', event.target.value)} aria-label={`${selectedTask.taskName} owner`} />
                      </label>
                      <label>
                        <span>Due time</span>
                        <input value={getTaskDetailDraft(selectedTask).dueTime} onChange={event => updateTaskDetailDraft(selectedTask, 'dueTime', event.target.value)} aria-label={`${selectedTask.taskName} due time`} />
                      </label>
                      <label>
                        <span>Location</span>
                        <input value={getTaskDetailDraft(selectedTask).location} onChange={event => updateTaskDetailDraft(selectedTask, 'location', event.target.value)} aria-label={`${selectedTask.taskName} location`} />
                      </label>
                      <label className="full-width-field">
                        <span>Blocker reason</span>
                        <textarea value={getTaskDetailDraft(selectedTask).blockerReason} onChange={event => updateTaskDetailDraft(selectedTask, 'blockerReason', event.target.value)} aria-label={`${selectedTask.taskName} blocker reason`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button" disabled={updatingTaskDetailsId === selectedTask.id}>Save task details</button>
                    </form>
                  )}

                  {onUpdateTaskStatus && selectedTask.id && (
                    <div className="operational-task-actions" aria-label={`Update ${selectedTask.taskName} status`}>
                      <button type="button" className="secondary-action-button compact-button" disabled={updatingTaskId === selectedTask.id || selectedTask.status === 'IN_PROGRESS'} onClick={() => updateStatus(selectedTask, 'IN_PROGRESS')}>Start</button>
                      <button type="button" className="secondary-action-button compact-button" disabled={updatingTaskId === selectedTask.id || selectedTask.status === 'BLOCKED'} onClick={() => updateStatus(selectedTask, 'BLOCKED')}>Block</button>
                      <button type="button" className="secondary-action-button compact-button" disabled={updatingTaskId === selectedTask.id || selectedTask.status === 'COMPLETE'} onClick={() => updateStatus(selectedTask, 'COMPLETE')}>Complete</button>
                    </div>
                  )}

                  {onDeleteTask && selectedTask.id && (
                    <button type="button" className="danger-outline-button compact-button" disabled={deletingTaskId === selectedTask.id} onClick={() => removeTask(selectedTask)} data-testid="react-operational-task-remove-button">
                      {deletingTaskId === selectedTask.id ? 'Removing task...' : 'Remove task'}
                    </button>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : (
        <div className="operational-readiness-list" aria-label="Selected turnaround readiness workspace">
          {visibleReadinessOperations.map(item => (
            <article className="operational-readiness-card" key={item.id} data-testid="react-operational-readiness-card">
              <div>
                <p className="eyebrow">{item.status}</p>
                <h4>{item.title}</h4>
                <p>{item.shipName} · {item.route}</p>
                {item.notes && <p>{item.notes}</p>}
              </div>
              <dl className="role-booking-fields compact-fields">
                <div>
                  <dt>Sailing date</dt>
                  <dd>{item.sailingDate}</dd>
                </div>
                <div>
                  <dt>Turnaround port</dt>
                  <dd>{item.port || item.arrivalPort}</dd>
                </div>
                <div>
                  <dt>Passenger load</dt>
                  <dd>{item.passengerCount} passenger{item.passengerCount === 1 ? '' : 's'}</dd>
                </div>
                <div>
                  <dt>Readiness level</dt>
                  <dd>{item.readinessLevel}</dd>
                </div>
                <div>
                  <dt>Command status</dt>
                  <dd>{item.commandStatus || item.status}</dd>
                </div>
                <div>
                  <dt>Command readiness</dt>
                  <dd>{item.commandReadinessLevel || item.readinessLevel}</dd>
                </div>
              </dl>

              {onUpdateOperationCommand && roleView === 'turnaround-manager' && (
                <form className="operational-command-form" onSubmit={event => { event.preventDefault(); saveOperationCommand(item) }} data-testid="react-operational-command-form">
                  <label>
                    <span>Command status</span>
                    <select value={getOperationCommandDraft(item).status} onChange={event => updateOperationCommandDraft(item, 'status', event.target.value)} aria-label={`${item.title} command status`}>
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="READY">Ready</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETE">Complete</option>
                    </select>
                  </label>
                  <label>
                    <span>Command readiness</span>
                    <select value={getOperationCommandDraft(item).readinessLevel} onChange={event => updateOperationCommandDraft(item, 'readinessLevel', event.target.value)} aria-label={`${item.title} command readiness`}>
                      {COMMAND_READINESS_OPTIONS.map(option => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Turnaround port</span>
                    <input value={getOperationCommandDraft(item).port} onChange={event => updateOperationCommandDraft(item, 'port', event.target.value)} aria-label={`${item.title} turnaround port`} />
                  </label>
                  <label className="full-width-field">
                    <span>Command notes</span>
                    <textarea value={getOperationCommandDraft(item).notes} onChange={event => updateOperationCommandDraft(item, 'notes', event.target.value)} aria-label={`${item.title} command notes`} rows="3" />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button" disabled={updatingOperationId === item.id || !getOperationCommandDraft(item).readinessLevel.trim() || !getOperationCommandDraft(item).port.trim()}>Save command plan</button>
                </form>
              )}

              {item.taskSummary && (
                <div className="operational-progress-summary" data-testid="react-operational-progress-summary">
                  <span>{item.taskSummary.completeTasks} of {item.taskSummary.totalTasks} tasks complete</span>
                  <span>{item.taskSummary.completionPercent}% task ready</span>
                  {item.signoffSummary && <span>{item.signoffSummary.approvedSignoffs} of {item.signoffSummary.totalSignoffs} signoffs approved</span>}
                  {item.taskSummary.blockedTasks > 0 && <span>{item.taskSummary.blockedTasks} blocked</span>}
                </div>
              )}

              {item.escalationSummary && (
                <div className="operational-escalation-summary" data-testid="react-operational-escalation-summary">
                  <strong>Escalation watch</strong>
                  <span>{item.escalationSummary.openEscalations} open</span>
                  <span>{item.escalationSummary.monitoringEscalations} monitoring</span>
                  <span>{item.escalationSummary.criticalEscalations} critical</span>
                </div>
              )}


              {item.dependencySummary && (
                <div className="operational-dependency-summary" data-testid="react-operational-dependency-summary">
                  <strong>Dependency gates</strong>
                  <span>{item.dependencySummary.clearedDependencies} of {item.dependencySummary.totalDependencies} clear</span>
                  {item.dependencySummary.activeDependencies > 0 && <span>{item.dependencySummary.activeDependencies} active</span>}
                </div>
              )}

              {item.taskDependencies?.length > 0 && (
                <div className="operational-dependency-list" data-testid="react-operational-dependency-list">
                  <strong>Task dependencies</strong>
                  <ul>
                    {item.taskDependencies.map(dependency => (
                      <li key={dependency.id}>
                        <span>{dependency.taskName}</span>
                        <span>depends on {dependency.dependsOnTaskName}</span>
                        <span>{dependency.status}</span>
                        {dependency.notes && <span>{dependency.notes}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.handoffSummary && (
                <div className="operational-handoff-summary" data-testid="react-operational-handoff-summary">
                  <strong>Department handoffs</strong>
                  <span>{item.handoffSummary.completedHandoffs} of {item.handoffSummary.totalHandoffs} complete</span>
                  {item.handoffSummary.blockedHandoffs > 0 && <span>{item.handoffSummary.blockedHandoffs} blocked</span>}
                </div>
              )}

              {item.handoffs?.length > 0 && (
                <div className="operational-handoff-list" data-testid="react-operational-handoff-list">
                  <strong>Handoff workflow</strong>
                  <ul>
                    {item.handoffs.map(handoff => (
                      <li key={handoff.id}>
                        <div><strong>{handoff.status}</strong> — {handoff.title}</div>
                        <p>{handoff.fromDepartmentRole} → {handoff.toDepartmentRole} · {handoff.ownerName || 'Owner pending'} · {handoff.dueTime || 'Due pending'}</p>
                        {handoff.notes && <p>{handoff.notes}</p>}
                        {onUpdateHandoff && (
                          <form className="operational-handoff-form" onSubmit={event => { event.preventDefault(); saveHandoffUpdate(handoff) }} data-testid="react-operational-handoff-form">
                            <label>
                              <span>Status</span>
                              <select value={getHandoffDraft(handoff).status} onChange={event => updateHandoffDraft(handoff, 'status', event.target.value)} aria-label={`${handoff.title} handoff status`}>
                                <option value="PENDING">Pending</option>
                                <option value="IN_REVIEW">In review</option>
                                <option value="BLOCKED">Blocked</option>
                                <option value="COMPLETE">Complete</option>
                              </select>
                            </label>
                            <label>
                              <span>Owner</span>
                              <input value={getHandoffDraft(handoff).ownerName} onChange={event => updateHandoffDraft(handoff, 'ownerName', event.target.value)} aria-label={`${handoff.title} handoff owner`} />
                            </label>
                            <label>
                              <span>Due time</span>
                              <input value={getHandoffDraft(handoff).dueTime} onChange={event => updateHandoffDraft(handoff, 'dueTime', event.target.value)} aria-label={`${handoff.title} handoff due time`} />
                            </label>
                            <label className="full-width-field">
                              <span>Handoff notes</span>
                              <input value={getHandoffDraft(handoff).notes} onChange={event => updateHandoffDraft(handoff, 'notes', event.target.value)} aria-label={`${handoff.title} handoff notes`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button" disabled={updatingHandoffId === handoff.id || !getHandoffDraft(handoff).ownerName.trim()}>Save handoff</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}


              {item.staffingSummary && (
                <div className="operational-staffing-summary" data-testid="react-operational-staffing-summary">
                  <strong>Staffing check-in</strong>
                  <span>{item.staffingSummary.checkedInCount} of {item.staffingSummary.plannedCount} crew checked in</span>
                  <span>{item.staffingSummary.checkInPercent}% staffed</span>
                  {item.staffingSummary.gapCount > 0 && <span>{item.staffingSummary.gapCount} gap{item.staffingSummary.gapCount === 1 ? '' : 's'}</span>}
                </div>
              )}

              {item.staffing?.length > 0 && (
                <div className="operational-staffing-list" data-testid="react-operational-staffing-list">
                  <strong>Department staffing plan</strong>
                  <ul>
                    {item.staffing.map(staffing => (
                      <li key={`${item.id}-${staffing.departmentRole}`}>
                        <span>{staffing.departmentRole}</span>
                        <span>{staffing.checkedInCount} / {staffing.plannedCount}</span>
                        <span>{staffing.leadName || 'Lead pending'}</span>
                        <span>{staffing.musterLocation || 'Muster pending'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onUpdateStaffing && (
                <form className="operational-staffing-form" onSubmit={event => { event.preventDefault(); saveStaffing(item) }} data-testid="react-operational-staffing-form">
                  <label>
                    <span>Planned staff</span>
                    <input type="number" min="0" value={getStaffingDraft(item).plannedCount} onChange={event => updateStaffingDraft(item, 'plannedCount', event.target.value)} aria-label={`${item.title} planned staff`} />
                  </label>
                  <label>
                    <span>Checked in</span>
                    <input type="number" min="0" value={getStaffingDraft(item).checkedInCount} onChange={event => updateStaffingDraft(item, 'checkedInCount', event.target.value)} aria-label={`${item.title} checked in staff`} />
                  </label>
                  <label>
                    <span>Staffing lead</span>
                    <input value={getStaffingDraft(item).leadName} onChange={event => updateStaffingDraft(item, 'leadName', event.target.value)} aria-label={`${item.title} staffing lead`} />
                  </label>
                  <label>
                    <span>Muster location</span>
                    <input value={getStaffingDraft(item).musterLocation} onChange={event => updateStaffingDraft(item, 'musterLocation', event.target.value)} aria-label={`${item.title} staffing muster location`} />
                  </label>
                  <label className="full-width-field">
                    <span>Staffing notes</span>
                    <input value={getStaffingDraft(item).notes} onChange={event => updateStaffingDraft(item, 'notes', event.target.value)} aria-label={`${item.title} staffing notes`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button" disabled={updatingStaffingKey === `${item.id}:${roleView}` || !getStaffingDraft(item).leadName.trim()}>Save staffing plan</button>
                </form>
              )}

              {onCreateEscalation && (
                <form className="operational-escalation-create-form" onSubmit={event => { event.preventDefault(); saveEscalationCreate(item) }} data-testid="react-operational-escalation-create-form">
                  <label>
                    <span>Escalation department</span>
                    <select value={getEscalationCreateDraft(item).departmentRole} onChange={event => updateEscalationCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} escalation department`}>
                      <option value="turnaround-manager">Turnaround Manager</option>
                      <option value="housekeeping-lead">Housekeeping Lead</option>
                      <option value="guest-services-lead">Guest Services Lead</option>
                      <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                      <option value="engineering-lead">Engineering Lead</option>
                    </select>
                  </label>
                  <label>
                    <span>Severity</span>
                    <select value={getEscalationCreateDraft(item).severity} onChange={event => updateEscalationCreateDraft(item, 'severity', event.target.value)} aria-label={`${item.title} escalation severity`}>
                      <option value="WATCH">Watch</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </label>
                  <label className="full-width-field">
                    <span>Escalation title</span>
                    <input value={getEscalationCreateDraft(item).title} onChange={event => updateEscalationCreateDraft(item, 'title', event.target.value)} aria-label={`${item.title} escalation title`} />
                  </label>
                  <label>
                    <span>Owner</span>
                    <input value={getEscalationCreateDraft(item).ownerName} onChange={event => updateEscalationCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} escalation owner`} />
                  </label>
                  <label className="full-width-field">
                    <span>Escalation notes</span>
                    <input value={getEscalationCreateDraft(item).resolutionNotes} onChange={event => updateEscalationCreateDraft(item, 'resolutionNotes', event.target.value)} aria-label={`${item.title} escalation notes`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button" disabled={creatingEscalationId === item.id || !getEscalationCreateDraft(item).title.trim()}>Add escalation</button>
                </form>
              )}

              {item.escalations?.length > 0 && (
                <div className="operational-escalation-list" data-testid="react-operational-escalation-list">
                  <strong>Active escalation log</strong>
                  <ul>
                    {item.escalations.map(escalation => (
                      <li key={escalation.id}>
                        <div><strong>{escalation.severity}</strong> — {escalation.title}</div>
                        <p>{escalation.departmentRole} · {escalation.ownerName || 'Owner pending'} · {escalation.status}</p>
                        {escalation.resolutionNotes && <p>{escalation.resolutionNotes}</p>}
                        {onUpdateEscalation && (
                          <form className="operational-escalation-update-form" onSubmit={event => { event.preventDefault(); saveEscalationUpdate(escalation) }} data-testid="react-operational-escalation-update-form">
                            <label>
                              <span>Status</span>
                              <select value={getEscalationUpdateDraft(escalation).status} onChange={event => updateEscalationDraft(escalation, 'status', event.target.value)} aria-label={`${escalation.title} escalation status`}>
                                <option value="OPEN">Open</option>
                                <option value="MONITORING">Monitoring</option>
                                <option value="RESOLVED">Resolved</option>
                              </select>
                            </label>
                            <label>
                              <span>Severity</span>
                              <select value={getEscalationUpdateDraft(escalation).severity} onChange={event => updateEscalationDraft(escalation, 'severity', event.target.value)} aria-label={`${escalation.title} escalation update severity`}>
                                <option value="WATCH">Watch</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                              </select>
                            </label>
                            <label>
                              <span>Owner</span>
                              <input value={getEscalationUpdateDraft(escalation).ownerName} onChange={event => updateEscalationDraft(escalation, 'ownerName', event.target.value)} aria-label={`${escalation.title} escalation update owner`} />
                            </label>
                            <label className="full-width-field">
                              <span>Resolution notes</span>
                              <input value={getEscalationUpdateDraft(escalation).resolutionNotes} onChange={event => updateEscalationDraft(escalation, 'resolutionNotes', event.target.value)} aria-label={`${escalation.title} escalation resolution notes`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button" disabled={updatingEscalationId === escalation.id || !getEscalationUpdateDraft(escalation).title.trim()}>Save escalation</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.signoffs.length > 0 && (
                <div className="operational-signoff-summary" data-testid="react-operational-signoff-summary">
                  <strong>Department readiness signoffs</strong>
                  <ul>
                    {item.signoffs.map(signoff => (
                      <li key={`${item.id}-${signoff.departmentRole}`}>
                        <span>{signoff.departmentRole}</span>
                        <span>{signoff.status}</span>
                        <span>{signoff.approverName || 'Approver pending'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onUpdateSignoff && (
                <form className="operational-signoff-form" onSubmit={event => { event.preventDefault(); saveSignoff(item) }} data-testid="react-operational-signoff-form">
                  <label>
                    <span>Readiness status</span>
                    <select value={getSignoffDraft(item).status} onChange={event => updateSignoffDraft(item, 'status', event.target.value)} aria-label={`${item.title} readiness signoff status`}>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </label>
                  <label>
                    <span>Approver</span>
                    <input value={getSignoffDraft(item).approverName} onChange={event => updateSignoffDraft(item, 'approverName', event.target.value)} aria-label={`${item.title} readiness approver`} />
                  </label>
                  <label className="full-width-field">
                    <span>Signoff notes</span>
                    <input value={getSignoffDraft(item).notes} onChange={event => updateSignoffDraft(item, 'notes', event.target.value)} aria-label={`${item.title} readiness notes`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button" disabled={updatingSignoffKey === `${item.id}:${roleView}` || !getSignoffDraft(item).approverName.trim()}>Save readiness signoff</button>
                </form>
              )}

              {onCreateTask && (
                <form className="operational-task-create-form" onSubmit={event => { event.preventDefault(); saveTaskCreate(item) }} data-testid="react-operational-task-create-form">
                  <label>
                    <span>New task department</span>
                    <select value={getTaskCreateDraft(item).departmentRole} onChange={event => updateTaskCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} new task department`}>
                      <option value="turnaround-manager">Turnaround Manager</option>
                      <option value="housekeeping-lead">Housekeeping Lead</option>
                      <option value="guest-services-lead">Guest Services Lead</option>
                      <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                      <option value="engineering-lead">Engineering Lead</option>
                    </select>
                  </label>
                  <label className="full-width-field">
                    <span>New task name</span>
                    <input value={getTaskCreateDraft(item).taskName} onChange={event => updateTaskCreateDraft(item, 'taskName', event.target.value)} aria-label={`${item.title} new task name`} />
                  </label>
                  <label>
                    <span>Owner</span>
                    <input value={getTaskCreateDraft(item).ownerName} onChange={event => updateTaskCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} new task owner`} />
                  </label>
                  <label>
                    <span>Due time</span>
                    <input value={getTaskCreateDraft(item).dueTime} onChange={event => updateTaskCreateDraft(item, 'dueTime', event.target.value)} aria-label={`${item.title} new task due time`} />
                  </label>
                  <label>
                    <span>Location</span>
                    <input value={getTaskCreateDraft(item).location} onChange={event => updateTaskCreateDraft(item, 'location', event.target.value)} aria-label={`${item.title} new task location`} />
                  </label>
                  <label className="full-width-field">
                    <span>Blocker reason</span>
                    <input value={getTaskCreateDraft(item).blockerReason} onChange={event => updateTaskCreateDraft(item, 'blockerReason', event.target.value)} aria-label={`${item.title} new task blocker reason`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button" disabled={creatingTaskId === item.id || !getTaskCreateDraft(item).taskName.trim()}>Add turnaround task</button>
                </form>
              )}

              {item.tasks.length > 0 && (
                <ul className="operational-checklist" data-testid="react-operational-role-checklist">
                  {item.tasks.map(task => {
                    const isUpdating = updatingTaskId === task.id

                    return (
                      <li key={task.id || `${item.id}-${task.taskName}`}>
                        <div>
                          <strong>{task.status}</strong> — {task.taskName}
                        </div>
                        <dl className="operational-task-detail-list" data-testid="react-operational-task-details">
                          <div>
                            <dt>Owner</dt>
                            <dd>{task.ownerName || 'Unassigned'}</dd>
                          </div>
                          <div>
                            <dt>Due</dt>
                            <dd>{task.dueTime || 'Timing pending'}</dd>
                          </div>
                          <div>
                            <dt>Location</dt>
                            <dd>{task.location || 'Location pending'}</dd>
                          </div>
                        </dl>
                        {task.blockerReason && <p className="operational-blocker-note" data-testid="react-operational-blocker-note">Blocked: {task.blockerReason}</p>}
                        {task.updates?.length > 0 && (
                          <div className="operational-task-updates" data-testid="react-operational-task-updates">
                            <strong>Shift updates</strong>
                            <ul>
                              {task.updates.slice(0, 3).map(update => (
                                <li key={update.id}>
                                  <span>{update.authorName}</span>
                                  <span>{update.updateType || 'NOTE'}</span>
                                  <span>{update.message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {onCreateTaskUpdate && task.id && (
                          <form className="operational-task-update-form" onSubmit={event => { event.preventDefault(); saveTaskUpdate(task) }} data-testid="react-operational-task-update-form">
                            <label className="full-width-field">
                              <span>Shift update</span>
                              <input value={getTaskUpdateDraft(task)} onChange={event => updateTaskUpdateDraft(task, event.target.value)} aria-label={`${task.taskName} shift update`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button" disabled={creatingTaskUpdateId === task.id || !getTaskUpdateDraft(task).trim()}>Add shift update</button>
                          </form>
                        )}
                        {onUpdateTaskDetails && task.id && (
                          <form className="operational-task-detail-form" onSubmit={event => { event.preventDefault(); saveTaskDetails(task) }} data-testid="react-operational-task-detail-form">
                            <label>
                              <span>Owner</span>
                              <input value={getTaskDetailDraft(task).ownerName} onChange={event => updateTaskDetailDraft(task, 'ownerName', event.target.value)} aria-label={`${task.taskName} owner`} />
                            </label>
                            <label>
                              <span>Due time</span>
                              <input value={getTaskDetailDraft(task).dueTime} onChange={event => updateTaskDetailDraft(task, 'dueTime', event.target.value)} aria-label={`${task.taskName} due time`} />
                            </label>
                            <label>
                              <span>Location</span>
                              <input value={getTaskDetailDraft(task).location} onChange={event => updateTaskDetailDraft(task, 'location', event.target.value)} aria-label={`${task.taskName} location`} />
                            </label>
                            <label className="full-width-field">
                              <span>Blocker reason</span>
                              <input value={getTaskDetailDraft(task).blockerReason} onChange={event => updateTaskDetailDraft(task, 'blockerReason', event.target.value)} aria-label={`${task.taskName} blocker reason`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button" disabled={updatingTaskDetailsId === task.id}>Save task details</button>
                          </form>
                        )}
                        {onUpdateTaskStatus && task.id && (
                          <div className="operational-task-actions" aria-label={`Update ${task.taskName} status`}>
                            <button type="button" className="secondary-action-button compact-button" disabled={isUpdating || task.status === 'IN_PROGRESS'} onClick={() => updateStatus(task, 'IN_PROGRESS')}>Start</button>
                            <button type="button" className="secondary-action-button compact-button" disabled={isUpdating || task.status === 'BLOCKED'} onClick={() => updateStatus(task, 'BLOCKED')}>Block</button>
                            <button type="button" className="secondary-action-button compact-button" disabled={isUpdating || task.status === 'COMPLETE'} onClick={() => updateStatus(task, 'COMPLETE')}>Complete</button>
                          </div>
                        )}
                        {onDeleteTask && task.id && (
                          <button type="button" className="danger-outline-button compact-button" disabled={deletingTaskId === task.id} onClick={() => removeTask(task)} data-testid="react-operational-task-remove-button">
                            {deletingTaskId === task.id ? 'Removing task...' : 'Remove task'}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function RoleBookingCard({ booking, roleView, isExpanded, favoriteActivityKeys, favoritesOnly, onToggleDetails, onToggleFavorite, onToggleFavoritesOnly }) {
  const passengers = getVisiblePassengerRows(booking)

  return (
    <article className="role-booking-card" data-testid="react-role-booking-card">
      <div className="role-booking-heading">
        <h3>{getBookingCardTitle(booking)}</h3>
        <div className="role-booking-badges">
          {roleView === 'group-leader' && <span className="status-pill">Group Leader</span>}
          <span className="status-pill">{booking.bookingStatus || 'Confirmed'}</span>
        </div>
      </div>

      <dl className="role-booking-fields">
        {getBookingCardFields(booking).map(([label, value]) => (
          <div key={`${booking.id}-${label}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="visible-passenger-list">
        <strong>Visible passengers</strong>
        {passengers.length === 0 ? (
          <p>No visible passengers for this booking.</p>
        ) : passengers.map(passenger => (
          <div key={passenger.id} className="visible-passenger-row">
            <span>{passenger.name}</span>
            <span>{passenger.role}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="primary-action-button full-width-action"
        aria-expanded={isExpanded}
        onClick={onToggleDetails}
        data-testid="react-role-booking-details-toggle"
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {isExpanded && (
        <RoleBookingDetails
          booking={booking}
          favoriteActivityKeys={favoriteActivityKeys}
          favoritesOnly={favoritesOnly}
          onToggleFavorite={onToggleFavorite}
          onToggleFavoritesOnly={onToggleFavoritesOnly}
        />
      )}
    </article>
  )
}

export default function ReactRoleDashboard({
  selectedDemoUser,
  customers = [],
  bookings = [],
  visibleBookings = [],
  turnaroundOperations = [],
  isLoadingTurnaroundOperations = false,
  turnaroundOperationsError = '',
  onRetryTurnaroundOperations,
  onUpdateTurnaroundOperationCommand,
  onUpdateTurnaroundTaskStatus,
  onUpdateTurnaroundTaskDetails,
  onCreateTurnaroundTask,
  onCreateTurnaroundTaskUpdate,
  onDeleteTurnaroundTask,
  onUpdateTurnaroundStaffing,
  onUpdateTurnaroundSignoff,
  onCreateTurnaroundEscalation,
  onUpdateTurnaroundEscalation,
  onUpdateTurnaroundHandoff,
  updatingTurnaroundOperationId = '',
  updatingTurnaroundTaskId = '',
  updatingTurnaroundTaskDetailsId = '',
  creatingTurnaroundTaskId = '',
  creatingTurnaroundTaskUpdateId = '',
  deletingTurnaroundTaskId = '',
  updatingTurnaroundStaffingKey = '',
  updatingTurnaroundSignoffKey = '',
  creatingTurnaroundEscalationId = '',
  updatingTurnaroundEscalationId = '',
  updatingTurnaroundHandoffId = '',
  turnaroundMutationStatus = '',
  turnaroundMutationError = '',
  onSavePassengerProfile,
  savingCustomerId = '',
  mutationError = '',
  cruiseLines = [],
  onBookingCreated
}) {
  const roleView = getSelectedRoleView(selectedDemoUser)
  const selectedCustomer = findDemoCustomer(selectedDemoUser, customers)
  const title = getRoleDashboardTitle(roleView)
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())
  const [favoriteItineraryActivitiesByBooking, setFavoriteItineraryActivitiesByBooking] = useState({})
  const [favoritesOnlyByBooking, setFavoritesOnlyByBooking] = useState({})
  const visibleBookingIds = useMemo(() => new Set(visibleBookings.map(booking => booking.id)), [visibleBookings])

  if (roleView === 'admin') return null

  function toggleBookingDetails(bookingId) {
    setExpandedBookingIds(current => {
      const next = new Set([...current].filter(id => visibleBookingIds.has(id)))

      if (next.has(bookingId)) next.delete(bookingId)
      else next.add(bookingId)

      return next
    })
  }

  function toggleFavoriteItineraryActivity(bookingId, activityKey) {
    setFavoriteItineraryActivitiesByBooking(current => {
      const nextFavorites = new Set(current[bookingId] || [])

      if (nextFavorites.has(activityKey)) nextFavorites.delete(activityKey)
      else nextFavorites.add(activityKey)

      return {
        ...current,
        [bookingId]: [...nextFavorites]
      }
    })
  }

  function toggleFavoritesOnly(bookingId) {
    setFavoritesOnlyByBooking(current => ({
      ...current,
      [bookingId]: !current[bookingId]
    }))
  }

  return (
    <section className="react-role-dashboard" id="react-role-dashboard" aria-labelledby="react-role-dashboard-heading" data-testid={`react-${roleView}-dashboard`}>
      {roleView === 'group-leader' && (
        <div className="status-card compact" data-testid="react-passenger-dashboard">
          Group leader dashboard loaded with passenger-manifest visibility.
        </div>
      )}
      <p className="eyebrow">Role-aware view</p>
      <h2 id="react-role-dashboard-heading">{title}</h2>
      <p>
        {getRoleSummaryLine({
          selectedDemoUser,
          selectedCustomer,
          visibleBookings
        })}
      </p>

      {roleView === 'passenger' && (
        <>
          <PassengerProfile
            selectedCustomer={selectedCustomer}
            selectedDemoUser={selectedDemoUser}
            visibleBookings={visibleBookings}
            onSavePassengerProfile={onSavePassengerProfile}
            savingCustomerId={savingCustomerId}
            mutationError={mutationError}
          />
          <PassengerCruiseBookingWorkflow
            cruiseLines={cruiseLines}
            customers={customers}
            bookings={bookings}
            selectedCustomer={selectedCustomer}
            selectedDemoUser={selectedDemoUser}
            onBookingCreated={onBookingCreated}
          />
        </>
      )}

      {isOperationalRoleView(roleView) && (
        <OperationalTurnaroundDashboard
          roleView={roleView}
          selectedDemoUser={selectedDemoUser}
          turnaroundOperations={turnaroundOperations}
          isLoading={isLoadingTurnaroundOperations}
          error={turnaroundOperationsError}
          onRetry={onRetryTurnaroundOperations}
          onUpdateOperationCommand={onUpdateTurnaroundOperationCommand}
          onUpdateTaskStatus={onUpdateTurnaroundTaskStatus}
          onUpdateTaskDetails={onUpdateTurnaroundTaskDetails}
          onCreateTask={onCreateTurnaroundTask}
          onCreateTaskUpdate={onCreateTurnaroundTaskUpdate}
          onDeleteTask={onDeleteTurnaroundTask}
          onUpdateStaffing={onUpdateTurnaroundStaffing}
          onUpdateSignoff={onUpdateTurnaroundSignoff}
          onCreateEscalation={onCreateTurnaroundEscalation}
          onUpdateEscalation={onUpdateTurnaroundEscalation}
          onUpdateHandoff={onUpdateTurnaroundHandoff}
          updatingOperationId={updatingTurnaroundOperationId}
          updatingTaskId={updatingTurnaroundTaskId}
          updatingTaskDetailsId={updatingTurnaroundTaskDetailsId}
          creatingTaskId={creatingTurnaroundTaskId}
          creatingTaskUpdateId={creatingTurnaroundTaskUpdateId}
          deletingTaskId={deletingTurnaroundTaskId}
          updatingStaffingKey={updatingTurnaroundStaffingKey}
          updatingSignoffKey={updatingTurnaroundSignoffKey}
          creatingEscalationId={creatingTurnaroundEscalationId}
          updatingEscalationId={updatingTurnaroundEscalationId}
          updatingHandoffId={updatingTurnaroundHandoffId}
          mutationStatus={turnaroundMutationStatus}
          mutationError={turnaroundMutationError}
        />
      )}

      {!isOperationalRoleView(roleView) && (
        <div className="role-booking-list">
          {visibleBookings.length === 0 ? (
            <p className="status-card compact">No bookings are visible for this selected demo user.</p>
          ) : visibleBookings.map(booking => {
            const bookingId = booking.id || booking.bookingId
            const favoriteActivityKeys = new Set(favoriteItineraryActivitiesByBooking[bookingId] || [])

            return (
              <RoleBookingCard
                key={bookingId}
                booking={booking}
                roleView={roleView}
                isExpanded={expandedBookingIds.has(bookingId)}
                favoriteActivityKeys={favoriteActivityKeys}
                favoritesOnly={Boolean(favoritesOnlyByBooking[bookingId])}
                onToggleDetails={() => toggleBookingDetails(bookingId)}
                onToggleFavorite={activityKey => toggleFavoriteItineraryActivity(bookingId, activityKey)}
                onToggleFavoritesOnly={() => toggleFavoritesOnly(bookingId)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
