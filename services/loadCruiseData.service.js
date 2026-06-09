const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

const db = require('../db')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const demoUserTable = require('../models/demoUser.model')
const appUserTable = require('../models/appUser.model')
const appRoleTable = require('../models/appRole.model')
const appUserRoleTable = require('../models/appUserRole.model')
const customerItineraryFavoriteTable = require('../models/customerItineraryFavorite.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundTaskTable = require('../models/turnaroundTask.model')
const turnaroundTaskUpdateTable = require('../models/turnaroundTaskUpdate.model')
const turnaroundSignoffTable = require('../models/turnaroundSignoff.model')
const turnaroundEscalationTable = require('../models/turnaroundEscalation.model')
const turnaroundStaffingTable = require('../models/turnaroundStaffing.model')
const turnaroundTaskDependencyTable = require('../models/turnaroundTaskDependency.model')
const turnaroundHandoffTable = require('../models/turnaroundHandoff.model')

const SEED_FILE_PATH = path.join(__dirname, '..', 'data', 'cruise.json')
const INSERT_CHUNK_SIZE = 500

let cachedCruiseData

function readCruiseSeedData() {
  if (!cachedCruiseData) {
    const fileContents = fs.readFileSync(SEED_FILE_PATH, 'utf-8')
    cachedCruiseData = JSON.parse(fileContents)
  }

  return cachedCruiseData
}


function normalizeRoleId(role) {
  return String(role || '').toLowerCase().replace(/_/g, '-')
}

function formatRoleDisplayName(role) {
  return String(role || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, character => character.toUpperCase())
}

function getNormalizedRoleType(role) {
  const normalizedRole = String(role || '').trim().toUpperCase().replace(/[ -]/g, '_')

  if (['ADMIN', 'PASSENGER', 'GROUP_LEADER'].includes(normalizedRole)) {
    return normalizedRole
  }

  return 'OPERATIONS'
}


function buildAppUserLookup(appUserRows) {
  const exactNameLookup = new Map()
  const prefixNameLookup = new Map()

  for (const appUser of appUserRows) {
    if (!exactNameLookup.has(appUser.displayName)) {
      exactNameLookup.set(appUser.displayName, appUser.id)
    }

    const [displayNamePrefix] = String(appUser.displayName || '').split(' — ')
    if (displayNamePrefix && !prefixNameLookup.has(displayNamePrefix)) {
      prefixNameLookup.set(displayNamePrefix, appUser.id)
    }
  }

  return function resolveAppUserId(displayName) {
    if (!displayName) return null
    return exactNameLookup.get(displayName) || prefixNameLookup.get(displayName) || null
  }
}

function getNormalizedUserType(role) {
  const normalizedRoleType = getNormalizedRoleType(role)

  return normalizedRoleType === 'PASSENGER' || normalizedRoleType === 'GROUP_LEADER'
    ? 'PASSENGER'
    : 'EMPLOYEE'
}

async function insertRows(tx, table, rows) {
  if (!rows.length) return 0

  for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
    await tx.insert(table).values(rows.slice(index, index + INSERT_CHUNK_SIZE))
  }

  return rows.length
}

function buildSeedRows(cruiseData) {
  const cruiseLineRows = []
  const shipRows = []
  const sailingRows = []
  const itineraryDayRows = []
  const activityRows = []
  const customerRows = []
  const bookingRows = []
  const bookingPassengerRows = []
  const demoUserRows = []
  const appUserRows = []
  const appRoleRows = []
  const appUserRoleRows = []
  const turnaroundOperationRows = []
  const turnaroundTaskRows = []
  const turnaroundTaskUpdateRows = []
  const turnaroundSignoffRows = []
  const turnaroundEscalationRows = []
  const turnaroundStaffingRows = []
  const turnaroundTaskDependencyRows = []
  const turnaroundHandoffRows = []
  const sailingIdBySeedKey = new Map()

  for (const cruiseLine of cruiseData.cruiseLines || []) {
    const cruiseLineId = randomUUID()

    cruiseLineRows.push({
      id: cruiseLineId,
      name: cruiseLine.name,
      country: cruiseLine.country,
      website: cruiseLine.website,
      brandFamily: cruiseLine.brandFamily,
      brandTheme: cruiseLine.brandTheme,
      marketPositioning: cruiseLine.marketPositioning
    })

    for (const ship of cruiseLine.ships || []) {
      const shipId = randomUUID()

      shipRows.push({
        id: shipId,
        name: ship.name,
        currentPort: ship.currentPort,
        cruiseLineId
      })

      for (const sailing of ship.sailings || []) {
        const sailingId = randomUUID()

        sailingIdBySeedKey.set(`${ship.name}|${sailing.departureDate}`, sailingId)
        sailingRows.push({
          id: sailingId,
          shipId,
          departureDate: sailing.departureDate,
          port: sailing.port || sailing.departurePort,
          departurePort: sailing.departurePort || sailing.port,
          arrivalPort: sailing.arrivalPort || sailing.port,
          days: sailing.days,
          isRepositioning: Boolean(sailing.isRepositioning)
        })

        for (const itineraryDay of sailing.itinerary || []) {
          const itineraryDayId = randomUUID()

          itineraryDayRows.push({
            id: itineraryDayId,
            sailingId,
            day: itineraryDay.day,
            title: itineraryDay.title,
            port: itineraryDay.port
          })

          for (const activity of itineraryDay.activitySchedule || []) {
            activityRows.push({
              id: randomUUID(),
              itineraryDayId,
              time: activity.time,
              activity: activity.activity
            })
          }
        }
      }
    }
  }

  for (const customer of cruiseData.customers || []) {
    customerRows.push({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      loyaltyNumber: customer.loyaltyNumber
    })
  }

  for (const booking of cruiseData.bookings || []) {
    const sailingId = booking.sailingId || sailingIdBySeedKey.get(`${booking.shipName}|${booking.departureDate}`)

    if (!sailingId) {
      throw new Error(`Unable to resolve sailing for booking ${booking.id}`)
    }

    bookingRows.push({
      id: booking.id,
      sailingId,
      bookingStatus: booking.bookingStatus,
      cabinNumber: booking.cabinNumber,
      fareCode: booking.fareCode,
      embarkationPort: booking.embarkationPort,
      debarkationPort: booking.debarkationPort,
      createdByCustomerId: booking.createdByCustomerId
    })

    for (const passenger of booking.passengers || []) {
      bookingPassengerRows.push({
        id: `${booking.id}-${passenger.customerId}`,
        bookingId: booking.id,
        customerId: passenger.customerId,
        passengerRole: passenger.passengerRole,
        isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
        diningPreference: passenger.diningPreference,
        accessibilityNotes: passenger.accessibilityNotes,
        boardingGroup: passenger.boardingGroup
      })
    }
  }

  const normalizedRoleIds = new Set()

  for (const demoUser of cruiseData.demoUsers || []) {
    const normalizedRoleId = normalizeRoleId(demoUser.role)
    const normalizedUserId = demoUser.id

    if (!normalizedRoleIds.has(normalizedRoleId)) {
      normalizedRoleIds.add(normalizedRoleId)
      appRoleRows.push({
        id: normalizedRoleId,
        displayName: formatRoleDisplayName(demoUser.role),
        roleType: getNormalizedRoleType(demoUser.role),
        description: `Normalized access role for ${formatRoleDisplayName(demoUser.role)} users`
      })
    }

    appUserRows.push({
      id: normalizedUserId,
      displayName: demoUser.displayName,
      email: `${demoUser.id}@cruise-explorer.local`,
      userType: getNormalizedUserType(demoUser.role),
      primaryCustomerId: demoUser.customerId,
      status: 'ACTIVE'
    })

    appUserRoleRows.push({
      id: `${normalizedUserId}-${normalizedRoleId}`,
      userId: normalizedUserId,
      roleId: normalizedRoleId,
      assignmentScope: demoUser.customerId ? 'CUSTOMER' : 'GLOBAL',
      status: 'ACTIVE'
    })

    demoUserRows.push({
      id: demoUser.id,
      displayName: demoUser.displayName,
      role: demoUser.role,
      customerId: demoUser.customerId,
      normalizedUserId,
      normalizedRoleId
    })
  }

  const resolveOperationalUserId = buildAppUserLookup(appUserRows)

  for (const turnaroundOperation of cruiseData.turnaroundOperations || []) {
    const operationId = randomUUID()
    const sailingId = turnaroundOperation.sailingId || sailingIdBySeedKey.get(`${turnaroundOperation.shipName}|${turnaroundOperation.departureDate}`)

    if (!sailingId) {
      throw new Error(`Unable to resolve sailing for turnaround operation ${turnaroundOperation.title || turnaroundOperation.id || turnaroundOperation.shipName}`)
    }

    turnaroundOperationRows.push({
      id: operationId,
      sailingId,
      title: turnaroundOperation.title,
      turnaroundDate: turnaroundOperation.turnaroundDate || turnaroundOperation.departureDate,
      port: turnaroundOperation.port,
      status: turnaroundOperation.status,
      readinessLevel: turnaroundOperation.readinessLevel,
      notes: turnaroundOperation.notes
    })

    for (const signoff of turnaroundOperation.signoffs || []) {
      turnaroundSignoffRows.push({
        id: randomUUID(),
        operationId,
        departmentRole: signoff.departmentRole,
        approverName: signoff.approverName,
        approverUserId: resolveOperationalUserId(signoff.approverName),
        status: signoff.status || 'PENDING',
        notes: signoff.notes,
        signedAt: signoff.signedAt
      })
    }

    for (const staffing of turnaroundOperation.staffing || []) {
      turnaroundStaffingRows.push({
        id: randomUUID(),
        operationId,
        departmentRole: staffing.departmentRole,
        plannedCount: Number(staffing.plannedCount || 0),
        checkedInCount: Number(staffing.checkedInCount || 0),
        leadName: staffing.leadName,
        musterLocation: staffing.musterLocation,
        notes: staffing.notes
      })
    }

    for (const escalation of turnaroundOperation.escalations || []) {
      turnaroundEscalationRows.push({
        id: randomUUID(),
        operationId,
        departmentRole: escalation.departmentRole,
        severity: escalation.severity || 'WATCH',
        title: escalation.title,
        ownerName: escalation.ownerName,
        ownerUserId: resolveOperationalUserId(escalation.ownerName),
        status: escalation.status || 'OPEN',
        resolutionNotes: escalation.resolutionNotes,
        createdAt: escalation.createdAt || new Date().toISOString()
      })
    }

    const taskIdByName = new Map()

    for (const [index, task] of (turnaroundOperation.tasks || []).entries()) {
      const taskId = randomUUID()
      taskIdByName.set(task.taskName, taskId)

      turnaroundTaskRows.push({
        id: taskId,
        operationId,
        departmentRole: task.departmentRole,
        taskName: task.taskName,
        ownerName: task.ownerName,
        ownerUserId: resolveOperationalUserId(task.ownerName),
        dueTime: task.dueTime,
        location: task.location,
        blockerReason: task.blockerReason,
        status: task.status,
        sortOrder: task.sortOrder ?? index + 1
      })

      for (const update of task.updates || []) {
        turnaroundTaskUpdateRows.push({
          id: randomUUID(),
          taskId,
          authorName: update.authorName,
          authorUserId: resolveOperationalUserId(update.authorName),
          updateType: update.updateType || 'NOTE',
          message: update.message,
          createdAt: update.createdAt || new Date().toISOString()
        })
      }
    }

    for (const dependency of turnaroundOperation.taskDependencies || []) {
      const taskId = taskIdByName.get(dependency.taskName)
      const dependsOnTaskId = taskIdByName.get(dependency.dependsOnTaskName)

      if (!taskId || !dependsOnTaskId) {
        throw new Error(`Unable to resolve turnaround task dependency for ${dependency.taskName || dependency.id || turnaroundOperation.title}`)
      }

      turnaroundTaskDependencyRows.push({
        id: randomUUID(),
        operationId,
        taskId,
        dependsOnTaskId,
        dependencyType: dependency.dependencyType || 'BLOCKS',
        status: dependency.status || 'ACTIVE',
        notes: dependency.notes
      })
    }

    for (const handoff of turnaroundOperation.handoffs || []) {
      turnaroundHandoffRows.push({
        id: randomUUID(),
        operationId,
        fromDepartmentRole: handoff.fromDepartmentRole,
        toDepartmentRole: handoff.toDepartmentRole,
        title: handoff.title,
        status: handoff.status || 'PENDING',
        ownerName: handoff.ownerName,
        ownerUserId: resolveOperationalUserId(handoff.ownerName),
        dueTime: handoff.dueTime,
        notes: handoff.notes,
        completedAt: handoff.completedAt
      })
    }
  }

  return {
    cruiseLineRows,
    shipRows,
    sailingRows,
    itineraryDayRows,
    activityRows,
    customerRows,
    bookingRows,
    bookingPassengerRows,
    demoUserRows,
    appUserRows,
    appRoleRows,
    appUserRoleRows,
    turnaroundOperationRows,
    turnaroundTaskRows,
    turnaroundTaskUpdateRows,
    turnaroundSignoffRows,
    turnaroundEscalationRows,
    turnaroundStaffingRows,
    turnaroundTaskDependencyRows,
    turnaroundHandoffRows
  }
}

async function loadCruiseData() {
  const cruiseData = readCruiseSeedData()
  const rows = buildSeedRows(cruiseData)

  await db.transaction(async tx => {
    await tx.delete(demoUserTable)
    await tx.delete(appUserRoleTable)
    await tx.delete(appUserTable)
    await tx.delete(appRoleTable)
    await tx.delete(turnaroundTaskUpdateTable)
    await tx.delete(turnaroundEscalationTable)
    await tx.delete(turnaroundTaskDependencyTable)
    await tx.delete(turnaroundHandoffTable)
    await tx.delete(turnaroundStaffingTable)
    await tx.delete(turnaroundSignoffTable)
    await tx.delete(turnaroundTaskTable)
    await tx.delete(turnaroundOperationTable)
    await tx.delete(customerItineraryFavoriteTable)
    await tx.delete(bookingPassengerTable)
    await tx.delete(bookingTable)
    await tx.delete(customerTable)
    await tx.delete(activityScheduleTable)
    await tx.delete(itineraryDayTable)
    await tx.delete(sailingTable)
    await tx.delete(shipTable)
    await tx.delete(cruiseLineTable)

    await insertRows(tx, cruiseLineTable, rows.cruiseLineRows)
    await insertRows(tx, shipTable, rows.shipRows)
    await insertRows(tx, sailingTable, rows.sailingRows)
    await insertRows(tx, itineraryDayTable, rows.itineraryDayRows)
    await insertRows(tx, activityScheduleTable, rows.activityRows)
    await insertRows(tx, customerTable, rows.customerRows)
    await insertRows(tx, appRoleTable, rows.appRoleRows)
    await insertRows(tx, appUserTable, rows.appUserRows)
    await insertRows(tx, appUserRoleTable, rows.appUserRoleRows)
    await insertRows(tx, bookingTable, rows.bookingRows)
    await insertRows(tx, bookingPassengerTable, rows.bookingPassengerRows)
    await insertRows(tx, demoUserTable, rows.demoUserRows)
    await insertRows(tx, turnaroundOperationTable, rows.turnaroundOperationRows)
    await insertRows(tx, turnaroundTaskTable, rows.turnaroundTaskRows)
    await insertRows(tx, turnaroundTaskUpdateTable, rows.turnaroundTaskUpdateRows)
    await insertRows(tx, turnaroundSignoffTable, rows.turnaroundSignoffRows)
    await insertRows(tx, turnaroundEscalationTable, rows.turnaroundEscalationRows)
    await insertRows(tx, turnaroundStaffingTable, rows.turnaroundStaffingRows)
    await insertRows(tx, turnaroundTaskDependencyTable, rows.turnaroundTaskDependencyRows)
    await insertRows(tx, turnaroundHandoffTable, rows.turnaroundHandoffRows)
  })

  if (process.env.NODE_ENV !== 'test' && process.env.SUPPRESS_DB_LOGS !== 'true') {
    console.log('Cruise seed data reset from data/cruise.json')
  }

  return {
    cruiseLineCount: rows.cruiseLineRows.length,
    shipCount: rows.shipRows.length,
    sailingCount: rows.sailingRows.length,
    itineraryDayCount: rows.itineraryDayRows.length,
    activityCount: rows.activityRows.length,
    customerCount: rows.customerRows.length,
    bookingCount: rows.bookingRows.length,
    bookingPassengerCount: rows.bookingPassengerRows.length,
    demoUserCount: rows.demoUserRows.length,
    appUserCount: rows.appUserRows.length,
    appRoleCount: rows.appRoleRows.length,
    appUserRoleCount: rows.appUserRoleRows.length,
    turnaroundOperationCount: rows.turnaroundOperationRows.length,
    turnaroundTaskCount: rows.turnaroundTaskRows.length,
    turnaroundTaskUpdateCount: rows.turnaroundTaskUpdateRows.length,
    turnaroundSignoffCount: rows.turnaroundSignoffRows.length,
    turnaroundEscalationCount: rows.turnaroundEscalationRows.length,
    turnaroundStaffingCount: rows.turnaroundStaffingRows.length,
    turnaroundTaskDependencyCount: rows.turnaroundTaskDependencyRows.length,
    turnaroundHandoffCount: rows.turnaroundHandoffRows.length,
    source: 'data/cruise.json'
  }
}

module.exports = loadCruiseData
