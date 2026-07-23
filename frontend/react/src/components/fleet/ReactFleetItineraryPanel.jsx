import { getItineraryDayLabel, getSailingDateLabel } from './fleetDirectoryUtils.js'

export default function ReactFleetItineraryPanel({
  selectedSailingForItinerary,
  itineraryDays,
  itineraryDayDraft,
  setItineraryDayDraft,
  activityDraft,
  setActivityDraft,
  itineraryActionId,
  itineraryActionMessage,
  itineraryLoading,
  itineraryError,
  activeItineraryDayEditId,
  itineraryDayEditDraft,
  setItineraryDayEditDraft,
  activeActivityEditId,
  activityEditDraft,
  setActivityEditDraft,
  handleCreateItineraryDay,
  handleCreateItineraryActivity,
  openItineraryDayEdit,
  requestDeleteItineraryDay,
  handleUpdateItineraryDay,
  cancelItineraryDayEdit,
  openActivityEdit,
  requestDeleteItineraryActivity,
  handleUpdateItineraryActivity,
  cancelActivityEdit
}) {
  if (!selectedSailingForItinerary) {
    return null
  }

  return (
<section className="react-itinerary-panel" aria-labelledby="react-itinerary-heading" data-testid="react-itinerary-panel">
  <div className="selected-ships-heading-row">
    <div>
      <p className="eyebrow ce-kicker">Selected sailing</p>
      <h3 id="react-itinerary-heading">{getSailingDateLabel(selectedSailingForItinerary)} Itinerary</h3>
    </div>
    <span className="selected-ships-count" data-testid="react-itinerary-count">{itineraryDays.length} days</span>
  </div>

  <form className="react-itinerary-create-form ce-editor-card" onSubmit={handleCreateItineraryDay} data-testid="react-create-itinerary-day-form">
    <h4>Create Itinerary Day</h4>
    <div className="react-itinerary-form-grid">
      <label>
        <span>Day</span>
        <input value={itineraryDayDraft.day} onChange={event => setItineraryDayDraft(current => ({ ...current, day: event.target.value }))} data-testid="react-create-itinerary-day-number" />
      </label>
      <label>
        <span>Title</span>
        <input value={itineraryDayDraft.title} onChange={event => setItineraryDayDraft(current => ({ ...current, title: event.target.value }))} data-testid="react-create-itinerary-day-title" />
      </label>
      <label>
        <span>Port</span>
        <input value={itineraryDayDraft.port} onChange={event => setItineraryDayDraft(current => ({ ...current, port: event.target.value }))} data-testid="react-create-itinerary-day-port" />
      </label>
    </div>
    <button type="submit" className="fleet-primary-action ce-button-primary" disabled={itineraryActionId === 'create-day'} data-testid="react-create-itinerary-day-submit-button">
      {itineraryActionId === 'create-day' ? 'Creating…' : 'Create Itinerary Day'}
    </button>
  </form>

  <form className="react-itinerary-create-form ce-editor-card" onSubmit={handleCreateItineraryActivity} data-testid="react-create-itinerary-activity-form">
    <h4>Create Activity</h4>
    <div className="react-itinerary-form-grid">
      <label>
        <span>Itinerary Day</span>
        <select value={activityDraft.itineraryDayId} onChange={event => setActivityDraft(current => ({ ...current, itineraryDayId: event.target.value }))} data-testid="react-create-itinerary-activity-day-select">
          <option value="">Choose a day</option>
          {itineraryDays.map(day => (
            <option key={day.id} value={day.id}>{getItineraryDayLabel(day)}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Time</span>
        <input value={activityDraft.time} onChange={event => setActivityDraft(current => ({ ...current, time: event.target.value }))} data-testid="react-create-itinerary-activity-time" />
      </label>
      <label>
        <span>Activity</span>
        <input value={activityDraft.activity} onChange={event => setActivityDraft(current => ({ ...current, activity: event.target.value }))} data-testid="react-create-itinerary-activity-name" />
      </label>
    </div>
    <button type="submit" className="fleet-primary-action ce-button-primary" disabled={itineraryActionId === 'create-activity'} data-testid="react-create-itinerary-activity-submit-button">
      {itineraryActionId === 'create-activity' ? 'Creating…' : 'Create Activity'}
    </button>
  </form>

  {itineraryActionMessage && <p className="muted-status ce-muted" role="status" data-testid="react-itinerary-action-message">{itineraryActionMessage}</p>}

  {itineraryLoading && <p className="muted-status ce-muted">Loading itinerary…</p>}
  {itineraryError && <p className="error" role="alert">{itineraryError}</p>}

  {!itineraryLoading && !itineraryError && itineraryDays.length === 0 && (
    <p className="muted-status ce-muted">No itinerary found for this sailing yet.</p>
  )}

  {itineraryDays.length > 0 && (
    <div className="react-itinerary-day-grid" data-testid="react-itinerary-day-grid">
      {itineraryDays.map(day => (
        <article className="react-itinerary-day-card" key={day.id || `${selectedSailingForItinerary.id}-${day.day}`} data-testid="react-itinerary-day-card">
          <h4>{getItineraryDayLabel(day)}</h4>
          <p><strong>Port:</strong> {day.port || 'At Sea'}</p>
          <div className="react-itinerary-card-actions">
            <button type="button" className="fleet-primary-action ce-button-primary" onClick={() => openItineraryDayEdit(day)} disabled={itineraryActionId === day.id} data-testid="react-update-itinerary-day-button">Update Day</button>
            <button type="button" className="fleet-danger-action ce-button-danger" onClick={() => requestDeleteItineraryDay(day)} disabled={itineraryActionId === day.id} data-testid="react-delete-itinerary-day-button">Delete Day</button>
          </div>
          {activeItineraryDayEditId === day.id && (
            <form className="react-inline-edit-form ce-editor-card" onSubmit={event => handleUpdateItineraryDay(event, day)} data-testid="react-itinerary-day-edit-form">
              <h5>Edit itinerary day</h5>
              <div className="react-inline-edit-grid">
                <label>
                  <span>Day</span>
                  <input value={itineraryDayEditDraft.day} onChange={event => setItineraryDayEditDraft(current => ({ ...current, day: event.target.value }))} data-testid="react-edit-itinerary-day-number" />
                </label>
                <label>
                  <span>Title</span>
                  <input value={itineraryDayEditDraft.title} onChange={event => setItineraryDayEditDraft(current => ({ ...current, title: event.target.value }))} data-testid="react-edit-itinerary-day-title" />
                </label>
                <label>
                  <span>Port</span>
                  <input value={itineraryDayEditDraft.port} onChange={event => setItineraryDayEditDraft(current => ({ ...current, port: event.target.value }))} data-testid="react-edit-itinerary-day-port" />
                </label>
              </div>
              <div className="react-inline-edit-actions ce-action-row">
                <button type="submit" className="fleet-primary-action ce-button-primary" disabled={itineraryActionId === day.id} data-testid="react-save-itinerary-day-edit">
                  {itineraryActionId === day.id ? 'Saving…' : 'Save Day'}
                </button>
                <button type="button" className="fleet-secondary-action ce-button-secondary" onClick={cancelItineraryDayEdit} data-testid="react-cancel-itinerary-day-edit">
                  Cancel
                </button>
              </div>
            </form>
          )}
          <ul className="react-itinerary-activity-list" data-testid="react-itinerary-activity-list">
            {(day.activitySchedule || []).length === 0 ? (
              <li>No scheduled activities yet.</li>
            ) : day.activitySchedule.map(activity => (
              <li key={activity.id || `${day.id}-${activity.time}-${activity.activity}`} data-testid="react-itinerary-activity">
                <strong>{activity.time || 'Time TBD'}:</strong> {activity.activity || 'Activity TBD'}
                <div className="react-itinerary-card-actions">
                  <button type="button" className="fleet-primary-action ce-button-primary" onClick={() => openActivityEdit(activity)} disabled={itineraryActionId === activity.id} data-testid="react-update-itinerary-activity-button">Update Activity</button>
                  <button type="button" className="fleet-danger-action ce-button-danger" onClick={() => requestDeleteItineraryActivity(activity)} disabled={itineraryActionId === activity.id} data-testid="react-delete-itinerary-activity-button">Delete Activity</button>
                </div>
                {activeActivityEditId === activity.id && (
                  <form className="react-inline-edit-form activity-inline-edit-form" onSubmit={event => handleUpdateItineraryActivity(event, activity)} data-testid="react-itinerary-activity-edit-form">
                    <h5>Edit activity</h5>
                    <div className="react-inline-edit-grid two-column-edit-grid">
                      <label>
                        <span>Time</span>
                        <input value={activityEditDraft.time} onChange={event => setActivityEditDraft(current => ({ ...current, time: event.target.value }))} data-testid="react-edit-itinerary-activity-time" />
                      </label>
                      <label>
                        <span>Activity</span>
                        <input value={activityEditDraft.activity} onChange={event => setActivityEditDraft(current => ({ ...current, activity: event.target.value }))} data-testid="react-edit-itinerary-activity-name" />
                      </label>
                    </div>
                    <div className="react-inline-edit-actions ce-action-row">
                      <button type="submit" className="fleet-primary-action ce-button-primary" disabled={itineraryActionId === activity.id} data-testid="react-save-itinerary-activity-edit">
                        {itineraryActionId === activity.id ? 'Saving…' : 'Save Activity'}
                      </button>
                      <button type="button" className="fleet-secondary-action ce-button-secondary" onClick={cancelActivityEdit} data-testid="react-cancel-itinerary-activity-edit">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  )}
</section>
  )
}
