import { useEffect, useState } from 'react'
import { updatePassengerPreCruiseChecklist } from '../../api/client.js'
import {
  getBookingCardTitle,
  getBookingItineraryDays,
  getItineraryDayActivities
} from '../../domain/roleView.js'

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

export function PassengerProfile({
  selectedCustomer,
  selectedDemoUser,
  visibleBookings = [],
  onSavePassengerProfile,
  savingCustomerId = '',
  mutationError = ''
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
    <section className="role-profile-card passenger-self-service ce-command-card" aria-labelledby="react-passenger-profile-heading" data-testid="react-passenger-self-service-panel">
      <h3 id="react-passenger-profile-heading">My travel profile</h3>
      <p>Passengers can update limited contact and cruise preference information for their booking experience.</p>

      <form className="passenger-profile-form react-passenger-profile-form ce-editor-card" onSubmit={handleSubmit} data-testid="react-passenger-profile-form">
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

        <button type="submit" className="primary-action-button ce-button-primary" disabled={isSaving} data-testid="react-passenger-profile-submit-button">
          {isSaving ? 'Saving profile...' : 'Save profile'}
        </button>
        <p className="draft-message ce-feedback-message ce-editor-card" role="status" aria-live="polite" data-testid="react-passenger-profile-message">
          {message || mutationError || 'Profile changes will be announced here.'}
        </p>
      </form>
    </section>
  )
}

function getActivityFavoriteKey(dayKey, activity = {}) {
  return `${dayKey}::${activity.id || activity.time || activity.activity || activity.name || 'activity'}`
}


export function PassengerVoyagePlanner({ selectedCustomer, visibleBookings = [], favoriteItineraryActivitiesByBooking = {}, onChecklistSaved }) {
  const bookingPlans = visibleBookings.map(booking => {
    const bookingId = booking.id || booking.bookingId || 'booking'
    const itineraryDays = getBookingItineraryDays(booking)
    const favoriteKeys = new Set(favoriteItineraryActivitiesByBooking[bookingId] || [])
    const activityRows = itineraryDays.flatMap(day => {
      const dayKey = String(day.id || day.day || day.title)
      return getItineraryDayActivities(day).map(activity => ({
        day,
        dayKey,
        activity,
        activityKey: getActivityFavoriteKey(dayKey, activity)
      }))
    })
    const favoriteRows = activityRows.filter(row => favoriteKeys.has(row.activityKey))
    const portDays = itineraryDays.filter(day => !String(day.port || day.title || '').toLowerCase().includes('sea'))
    const firstActivity = activityRows[0]

    return {
      booking,
      bookingId,
      itineraryDays,
      activityRows,
      favoriteRows,
      portDays,
      firstActivity
    }
  })

  const totalFavorites = bookingPlans.reduce((sum, plan) => sum + plan.favoriteRows.length, 0)
  const totalPortDays = bookingPlans.reduce((sum, plan) => sum + plan.portDays.length, 0)
  const nextPlan = bookingPlans.find(plan => plan.firstActivity) || bookingPlans[0]
  const selectedCustomerId = selectedCustomer?.id || ''
  const [checklistState, setChecklistState] = useState(() => normalizePreCruiseChecklist(selectedCustomer?.preCruiseChecklist || getDefaultPreCruiseChecklist()))
  const [savingChecklistItem, setSavingChecklistItem] = useState('')
  const [checklistMessage, setChecklistMessage] = useState('')
  const completeChecklistCount = Object.values(checklistState).filter(Boolean).length

  useEffect(() => {
    setChecklistState(normalizePreCruiseChecklist(selectedCustomer?.preCruiseChecklist || getDefaultPreCruiseChecklist()))
    setSavingChecklistItem('')
  }, [selectedCustomerId, selectedCustomer?.preCruiseChecklist?.documents, selectedCustomer?.preCruiseChecklist?.luggage, selectedCustomer?.preCruiseChecklist?.dining, selectedCustomer?.preCruiseChecklist?.excursions])

  useEffect(() => {
    setChecklistMessage('')
  }, [selectedCustomerId])

  async function toggleChecklistItem(item) {
    if (!selectedCustomerId || savingChecklistItem) return

    const nextChecklist = {
      ...checklistState,
      [item]: !checklistState[item]
    }
    const previousChecklist = checklistState

    setChecklistState(nextChecklist)
    setSavingChecklistItem(item)
    setChecklistMessage('Saving pre-cruise checklist...')

    try {
      const response = await updatePassengerPreCruiseChecklist(selectedCustomerId, nextChecklist)
      const savedChecklist = normalizePreCruiseChecklist(response?.preCruiseChecklist || nextChecklist)
      setChecklistState(savedChecklist)
      setChecklistMessage(response?.message || 'Pre-cruise checklist updated successfully')
      await onChecklistSaved?.()
    } catch (error) {
      setChecklistState(previousChecklist)
      setChecklistMessage(error.message || 'Could not save pre-cruise checklist.')
    } finally {
      setSavingChecklistItem('')
    }
  }

  return (
    <section className="passenger-voyage-planner" aria-labelledby="react-passenger-voyage-planner-heading" data-testid="react-passenger-voyage-planner">
      <div className="passenger-voyage-heading">
        <div>
          <p className="eyebrow ce-kicker">Passenger cruise tools</p>
          <h3 id="react-passenger-voyage-planner-heading">My voyage planner</h3>
          <p>Review sailing context, favorite activities, port days, and pre-cruise checklist progress from one passenger workspace.</p>
        </div>
        <div className="voyage-score-card" aria-label="Voyage planning summary">
          <strong>{completeChecklistCount}/4</strong>
          <span>Pre-cruise checklist complete</span>
        </div>
      </div>

      <div className="voyage-planner-grid">
        <article className="voyage-planner-card">
          <h4>Trip snapshot</h4>
          <dl className="compact-fields">
            <div><dt>Visible bookings</dt><dd>{visibleBookings.length}</dd></div>
            <div><dt>Port days</dt><dd>{totalPortDays}</dd></div>
            <div><dt>Saved activities</dt><dd>{totalFavorites}</dd></div>
            <div><dt>Next activity</dt><dd>{nextPlan?.firstActivity?.activity?.activity || nextPlan?.firstActivity?.activity?.name || 'Open itinerary details to review activities'}</dd></div>
          </dl>
        </article>

        <article className="voyage-planner-card">
          <h4>Pre-cruise checklist</h4>
          <div className="voyage-checklist" data-testid="react-voyage-checklist">
            {[
              ['documents', 'Travel documents verified'],
              ['luggage', 'Luggage tags and cabin assignment reviewed'],
              ['dining', 'Dining preference checked'],
              ['excursions', 'Favorite excursions selected']
            ].map(([id, label]) => (
              <label key={id} className="react-checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(checklistState[id])}
                  disabled={!selectedCustomerId || Boolean(savingChecklistItem)}
                  onChange={() => toggleChecklistItem(id)}
                  data-testid={`react-voyage-checklist-${id}`}
                />
                <span>{label}{savingChecklistItem === id ? ' — saving' : ''}</span>
              </label>
            ))}
          </div>
          <p className="draft-message ce-feedback-message ce-editor-card" aria-live="polite" data-testid="react-voyage-checklist-message">
            {checklistMessage || 'Checklist progress is saved to this passenger profile.'}
          </p>
        </article>
      </div>

      <div className="voyage-booking-strip" aria-label="Voyage booking summaries">
        {bookingPlans.length === 0 ? (
          <p className="status-card compact ce-command-card">No cruise bookings are visible for this passenger yet.</p>
        ) : bookingPlans.map(plan => (
          <article key={plan.bookingId} className="voyage-booking-card" data-testid="react-voyage-booking-card">
            <h4>{getBookingCardTitle(plan.booking)}</h4>
            <p>{plan.booking.cruiseLine?.name || 'Cruise line'} aboard {plan.booking.ship?.name || 'assigned ship'}</p>
            <ul>
              <li>{plan.itineraryDays.length} itinerary day{plan.itineraryDays.length === 1 ? '' : 's'}</li>
              <li>{plan.portDays.length} port day{plan.portDays.length === 1 ? '' : 's'}</li>
              <li>{plan.favoriteRows.length} saved activit{plan.favoriteRows.length === 1 ? 'y' : 'ies'}</li>
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

