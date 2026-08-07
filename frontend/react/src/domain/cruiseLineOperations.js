import {
  buildLineMetrics,
  buildSelectedOperatingScope,
  formatCount,
  getActivityHighlights,
  getLineId,
  getOperationalShips,
  getPortsForLine,
  getSailingDestination,
  getShipSailings
} from './cruiseLineOperationsData.js'
import {
  buildGuestExperienceRows,
  buildPortOperationsPlan,
  buildRevenueMix,
  buildSailingCalendar,
  buildSailingRevenueBoard
} from './cruiseLineCommercialOperations.js'

function buildCommercialNarrative(line = {}, metrics = {}) {
  const ports = metrics.ports || []
  const primaryPort = ports[0] || line.country || 'home-port markets'
  const secondaryPort = ports[1] || 'destination programming'

  return [
    { id: 'inventory', label: 'Inventory visibility', detail: `${line.name || 'The selected cruise line'} has ships, sailings, itinerary days, and booking demand in one connected workspace.` },
    { id: 'experience', label: 'Guest experience continuity', detail: 'Passenger preferences, manifest context, and itinerary activity data stay attached to the voyage instead of living in separate spreadsheets.' },
    { id: 'ports', label: 'Port and route story', detail: `The route footprint connects ${primaryPort} with ${secondaryPort}, supporting port planning, guest communication, and itinerary performance review.` },
    { id: 'handoff', label: 'Shipboard operations handoff', detail: 'Turnaround teams can move from the sailing story into real operational tasks, blockers, staffing, and signoffs.' }
  ]
}

function buildOperationsAgenda(line = {}, metrics = {}) {
  return [
    { id: 'brand', time: '0:00', title: 'Brand and fleet status', detail: `${line.name || 'Cruise line'} footprint, ships, sailings, and passenger demand.` },
    { id: 'voyage', time: '1:30', title: 'Voyage operations review', detail: 'Review the featured sailing, itinerary strip, port footprint, and onboard programming.' },
    { id: 'guest', time: '3:00', title: 'Guest and manifest operations', detail: `${formatCount(metrics.passengerCount)} passengers surfaced through booking and manifest context.` },
    { id: 'ops', time: '4:30', title: 'Turnaround operations handoff', detail: 'Connect customer-facing voyage data to ship turnaround execution.' },
    { id: 'sqa', time: '6:00', title: 'SQA verification', detail: 'Use the isolated SQA console when validation evidence is needed.' }
  ]
}

function buildCruiseLineClosePlan(line = {}, metrics = {}) {
  return [
    { id: 'pilot', label: 'Pilot a branded sailing workspace', detail: `${line.name || 'The cruise line'} can operate from one active ship, its sailings, guest bookings, itinerary program, and turnaround team.` },
    { id: 'connect', label: 'Connect guest and operations teams', detail: `The workspace links ${formatCount(metrics.bookingCount)} bookings, ${formatCount(metrics.passengerCount)} passengers, fleet records, and turnaround workstreams.` },
    { id: 'expand', label: 'Expand by voyage and department', detail: 'Additional ships, department leads, ports, and passenger groups can be layered in without changing the operations workflow.' }
  ]
}

function buildLineOperationsFlow(line = {}, metrics = {}, bookings = []) {
  const primaryShip = getOperationalShips(line, bookings)[0] || {}
  const primarySailing = getShipSailings(primaryShip)[0] || {}

  return [
    { id: 'fleet', label: 'Fleet and brand story', detail: `${line.name || 'Cruise line'} is represented with ${formatCount(metrics.shipCount)} ships and ${formatCount(metrics.sailingCount)} sailings.` },
    { id: 'voyage', label: 'Sailing and itinerary experience', detail: `${primaryShip.name || 'A selected ship'} shows a ${primarySailing.days || 'multi'}-day itinerary with ports, activity schedule, and embark/debark flow.` },
    { id: 'passengers', label: 'Guest manifest and booking view', detail: `${formatCount(metrics.bookingCount)} bookings and ${formatCount(metrics.passengerCount)} passengers connect the cruise product to real guest operations.` },
    { id: 'operations', label: 'Turnaround operations handoff', detail: 'The same platform connects passenger-facing voyage data to operational turnaround execution.' }
  ]
}

export {
  buildCommercialNarrative,
  buildCruiseLineClosePlan,
  buildGuestExperienceRows,
  buildLineOperationsFlow,
  buildLineMetrics,
  buildSelectedOperatingScope,
  buildOperationsAgenda,
  buildPortOperationsPlan,
  buildRevenueMix,
  buildSailingCalendar,
  buildSailingRevenueBoard,
  formatCount,
  getActivityHighlights,
  getLineId,
  getOperationalShips,
  getPortsForLine,
  getSailingDestination,
  getShipSailings
}
