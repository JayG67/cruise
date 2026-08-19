const fs = require('fs')
const path = require('path')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const demoUserTable = require('../models/demoUser.model')
const appUserTable = require('../models/appUser.model')
const appRoleTable = require('../models/appRole.model')
const appUserRoleTable = require('../models/appUserRole.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundTaskTable = require('../models/turnaroundTask.model')
const turnaroundEscalationTable = require('../models/turnaroundEscalation.model')
const turnaroundHandoffTable = require('../models/turnaroundHandoff.model')
const turnaroundSignoffTable = require('../models/turnaroundSignoff.model')
const auditEventTable = require('../models/auditEvent.model')
const db = require('../db')
const { buildDataArchitectureReadiness } = require('../services/dataArchitectureReadiness.service')
const { buildProductionHardeningReadiness } = require('../services/productionHardeningReadiness.service')
const { buildDeploymentReadiness } = require('../services/deploymentReadiness.service')
const { buildPublicLaunchReadiness } = require('../services/publicLaunchReadiness.service')
const { requireAdminRequest } = require('../services/requestAuthorization.service')

function safeReadProjectFile(relativePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
  } catch (error) {
    return ''
  }
}

function safeReadJsonProjectFile(relativePath) {
  try {
    return JSON.parse(safeReadProjectFile(relativePath) || '{}')
  } catch (error) {
    return {}
  }
}

function buildProjectFilePresenceMap() {
  const filePaths = [
    '.env.example',
    '.github/workflows',
    'Dockerfile',
    'drizzle.config.js',
    'docker-compose.yml',
    'dist',
    'fly.toml',
    'logs',
    'lighthouse-report',
    'lhci-report',
    'middleware/loggers.js',
    'middleware/requestIdentity.middleware.js',
    'middleware/validate.middleware.js',
    'performance/cruise-api-smoke.js',
    'public',
    'railway.json',
    'render.yaml',
    'services/requestAuthorization.service.js',
    'tests/unit/app.security.test.js'
  ]

  return Object.fromEntries(filePaths.map(filePath => [filePath, fs.existsSync(path.join(process.cwd(), filePath))]))
}

exports.getPublicLaunchReadiness = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const files = buildProjectFilePresenceMap()
    const packageJson = safeReadJsonProjectFile('package.json')
    const readme = safeReadProjectFile('README.md')
    const appSource = safeReadProjectFile('app.js')
    const controllerSource = safeReadProjectFile('controllers/cruise.controller.js')


    const [
      cruiseLines,
      ships,
      sailings,
      customers,
      bookings,
      bookingPassengers,
      demoUsers,
      appUsers,
      appRoles,
      appUserRoles,
      turnaroundOperations,
      turnaroundTasks,
      turnaroundEscalations,
      turnaroundHandoffs,
      turnaroundSignoffs,
      auditEvents
    ] = await Promise.all([
      db.select().from(cruiseLineTable),
      db.select().from(shipTable),
      db.select().from(sailingTable),
      db.select().from(customerTable),
      db.select().from(bookingTable),
      db.select().from(bookingPassengerTable),
      db.select().from(demoUserTable),
      db.select().from(appUserTable),
      db.select().from(appRoleTable),
      db.select().from(appUserRoleTable),
      db.select().from(turnaroundOperationTable),
      db.select().from(turnaroundTaskTable),
      db.select().from(turnaroundEscalationTable),
      db.select().from(turnaroundHandoffTable),
      db.select().from(turnaroundSignoffTable),
      db.select().from(auditEventTable)
    ])

    const dataArchitecture = buildDataArchitectureReadiness({
      cruiseLines,
      ships,
      sailings,
      customers,
      bookings,
      bookingPassengers,
      demoUsers,
      appUsers,
      appRoles,
      appUserRoles,
      turnaroundOperations,
      turnaroundTasks,
      escalations: turnaroundEscalations,
      handoffs: turnaroundHandoffs,
      signoffs: turnaroundSignoffs,
      auditEvents
    })

    const productionHardening = buildProductionHardeningReadiness({
      env: process.env,
      packageJson,
      files,
      appSource,
      controllerSource,
      loggerSource: safeReadProjectFile('middleware/loggers.js')
    })

    const deployment = buildDeploymentReadiness({
      env: process.env,
      packageJson,
      files,
      renderConfig: safeReadProjectFile('render.yaml'),
      dockerCompose: safeReadProjectFile('docker-compose.yml'),
      readme,
      appSource
    })

    return res.status(200).json(buildPublicLaunchReadiness({
      dataArchitecture,
      productionHardening,
      deployment
    }))
  } catch (err) {
    next(err)
  }
}

exports.getDeploymentReadiness = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    return res.status(200).json(buildDeploymentReadiness({
      env: process.env,
      packageJson: safeReadJsonProjectFile('package.json'),
      files: buildProjectFilePresenceMap(),
      renderConfig: safeReadProjectFile('render.yaml'),
      dockerCompose: safeReadProjectFile('docker-compose.yml'),
      readme: safeReadProjectFile('README.md'),
      appSource: safeReadProjectFile('app.js')
    }))
  } catch (err) {
    next(err)
  }
}

exports.getProductionHardeningReadiness = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    return res.status(200).json(buildProductionHardeningReadiness({
      env: process.env,
      packageJson: safeReadJsonProjectFile('package.json'),
      files: buildProjectFilePresenceMap(),
      appSource: safeReadProjectFile('app.js'),
      controllerSource: safeReadProjectFile('controllers/cruise.controller.js'),
      loggerSource: safeReadProjectFile('middleware/loggers.js')
    }))
  } catch (err) {
    next(err)
  }
}

exports.getDataArchitectureReadiness = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const [
      cruiseLines,
      ships,
      sailings,
      customers,
      bookings,
      bookingPassengers,
      demoUsers,
      appUsers,
      appRoles,
      appUserRoles,
      turnaroundOperations,
      turnaroundTasks,
      turnaroundEscalations,
      turnaroundHandoffs,
      turnaroundSignoffs,
      auditEvents
    ] = await Promise.all([
      db.select().from(cruiseLineTable),
      db.select().from(shipTable),
      db.select().from(sailingTable),
      db.select().from(customerTable),
      db.select().from(bookingTable),
      db.select().from(bookingPassengerTable),
      db.select().from(demoUserTable),
      db.select().from(appUserTable),
      db.select().from(appRoleTable),
      db.select().from(appUserRoleTable),
      db.select().from(turnaroundOperationTable),
      db.select().from(turnaroundTaskTable),
      db.select().from(turnaroundEscalationTable),
      db.select().from(turnaroundHandoffTable),
      db.select().from(turnaroundSignoffTable),
      db.select().from(auditEventTable)
    ])

    return res.status(200).json(buildDataArchitectureReadiness({
      cruiseLines,
      ships,
      sailings,
      customers,
      bookings,
      bookingPassengers,
      demoUsers,
      appUsers,
      appRoles,
      appUserRoles,
      turnaroundOperations,
      turnaroundTasks,
      escalations: turnaroundEscalations,
      handoffs: turnaroundHandoffs,
      signoffs: turnaroundSignoffs,
      auditEvents
    }))
  } catch (err) {
    next(err)
  }
}
