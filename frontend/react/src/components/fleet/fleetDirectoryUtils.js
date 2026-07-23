export const EMPTY_SHIP_DRAFT = {
  name: '',
  currentPort: ''
}

export const EMPTY_CRUISE_LINE_DRAFT = {
  name: '',
  country: '',
  website: '',
  brandFamily: '',
  brandTheme: '',
  marketPositioning: ''
}

export const EMPTY_SAILING_DRAFT = {
  departureDate: '',
  departurePort: '',
  arrivalPort: '',
  days: '',
  isRepositioning: false
}

export const EMPTY_ITINERARY_DAY_DRAFT = {
  day: '',
  title: '',
  port: ''
}

export const EMPTY_ACTIVITY_DRAFT = {
  itineraryDayId: '',
  time: '',
  activity: ''
}

export function buildCruiseLineDraft(cruiseLine = {}) {
  return {
    name: cruiseLine.name || '',
    country: cruiseLine.country || '',
    website: cruiseLine.website || '',
    brandFamily: cruiseLine.brandFamily || '',
    brandTheme: cruiseLine.brandTheme || '',
    marketPositioning: cruiseLine.marketPositioning || ''
  }
}

export function buildShipEditDraft(ship = {}) {
  return {
    name: ship.name || '',
    currentPort: getCurrentPortLabel(ship)
  }
}

export function buildSailingEditDraft(sailing = {}) {
  return {
    departureDate: sailing.departureDate || '',
    departurePort: sailing.departurePort || sailing.port || '',
    arrivalPort: sailing.arrivalPort || sailing.port || '',
    days: String(sailing.days || ''),
    isRepositioning: Boolean(sailing.isRepositioning)
  }
}

export function buildItineraryDayEditDraft(day = {}) {
  return {
    day: String(day.day || ''),
    title: day.title || '',
    port: day.port || ''
  }
}

export function buildActivityEditDraft(activity = {}) {
  return {
    time: activity.time || '',
    activity: activity.activity || ''
  }
}

export function getCurrentPortLabel(ship = {}) {
  return ship.currentPort || ship.current_port || ship.homePort || ship.home_port || 'Not currently listed'
}

export function getSailingDateLabel(sailing) {
  if (!sailing?.departureDate) {
    return 'Departure date unavailable'
  }

  return sailing.departureDate
}

export function getSailingTypeLabel(sailing) {
  return sailing?.isRepositioning ? 'Repositioning Sailing' : 'Round-Trip / Regional Sailing'
}

export function getItineraryDayLabel(day) {
  return `Day ${day?.day || '?'} — ${day?.title || 'Itinerary day'}`
}
