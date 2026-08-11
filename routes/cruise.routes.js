const express = require('express')

const cruiseController = require('../controllers/cruise.controller')
const validate = require('../middleware/validate.middleware')
const {
  requireAdminAccess,
  requireAdminMutation,
  requireActivityTenantAccess,
  requireCruiseLineTenantAccess,
  requireGlobalAdminMutation,
  requireItineraryDayTenantAccess,
  requireSailingTenantAccess,
  requireShipTenantAccess,
  requireTenantAuditAccess,
  requireBookingAccess,
  requireBookingCreationAccess,
  requireBookingPassengerAccess,
  requireCustomerAccess,
  requireFavoriteCustomerAccess,
  requireTurnaroundCommandAccess,
  requireTurnaroundDepartmentAccess,
  requireTurnaroundEscalationAccess,
  requireTurnaroundHandoffAccess,
  requireTurnaroundOperationReadAccess,
  requireTurnaroundReadAccess,
  requireTurnaroundTaskAccess
} = require('../middleware/authorization.middleware')

const {
  cruiseLineSchema,
  shipSchema,
  sailingSchema,
  itineraryDaySchema,
  activityScheduleSchema,
  customerSchema,
  bookingSchema,
  bookingPassengerCreateSchema,
  passengerCustomerUpdateSchema,
  bookingPreferenceUpdateSchema,
  preCruiseChecklistSchema,
  itineraryFavoriteSchema,
  turnaroundOperationCommandUpdateSchema,
  turnaroundTaskStatusUpdateSchema,
  turnaroundTaskDetailUpdateSchema,
  turnaroundTaskUpdateSchema,
  turnaroundTaskCreateSchema,
  turnaroundSignoffUpdateSchema,
  turnaroundStaffingUpdateSchema,
  turnaroundEscalationCreateSchema,
  turnaroundEscalationUpdateSchema,
  turnaroundHandoffUpdateSchema,
  turnaroundPersonAssignmentSchema
} = require('../validation/cruise.validation')

const router = express.Router()

router.get('/', cruiseController.getCruiseLines)

router.get(
  '/cruise-line',
  cruiseController.getMissingCruiseLineId
)

router.get(
  '/cruise-line/:id',
  cruiseController.getCruiseLineById
)

router.get(
  '/ships/:cruiseLineId',
  cruiseController.getShipsByCruiseLine
)



router.get(
  '/audit-events',
  requireAdminAccess,
  requireTenantAuditAccess,
  cruiseController.getPlatformAuditEvents
)



router.get(
  '/data-architecture/readiness',
  cruiseController.getDataArchitectureReadiness
)

router.get(
  '/production-hardening/readiness',
  cruiseController.getProductionHardeningReadiness
)

router.get(
  '/deployment/readiness',
  cruiseController.getDeploymentReadiness
)

router.get(
  '/public-launch/readiness',
  cruiseController.getPublicLaunchReadiness
)


router.get(
  '/turnaround-admin/setup',
  requireAdminAccess,
  cruiseController.getTurnaroundAdminSetup
)

router.post(
  '/turnaround-admin/people',
  requireAdminMutation,
  validate(turnaroundPersonAssignmentSchema),
  cruiseController.createTurnaroundPerson
)

router.patch(
  '/turnaround-admin/people/:id',
  requireAdminMutation,
  validate(turnaroundPersonAssignmentSchema.omit({ id: true })),
  cruiseController.updateTurnaroundPerson
)

router.delete(
  '/turnaround-admin/people/:id',
  requireAdminMutation,
  cruiseController.deleteTurnaroundPerson
)

router.get(
  '/turnaround-operations',
  requireTurnaroundReadAccess,
  cruiseController.getTurnaroundOperations
)

router.get(
  '/turnaround-operations/:id/audit-events',
  requireTurnaroundOperationReadAccess('id'),
  cruiseController.getTurnaroundOperationAuditEvents
)


router.patch(
  '/turnaround-operations/:id',
  requireTurnaroundCommandAccess,
  validate(turnaroundOperationCommandUpdateSchema),
  cruiseController.updateTurnaroundOperationCommand
)


router.post(
  '/turnaround-operations/:id/escalations',
  requireTurnaroundDepartmentAccess('id', 'departmentRole'),
  validate(turnaroundEscalationCreateSchema),
  cruiseController.createTurnaroundEscalation
)

router.patch(
  '/turnaround-escalations/:id',
  requireTurnaroundEscalationAccess,
  validate(turnaroundEscalationUpdateSchema),
  cruiseController.updateTurnaroundEscalation
)

router.patch(
  '/turnaround-handoffs/:id',
  requireTurnaroundHandoffAccess,
  validate(turnaroundHandoffUpdateSchema),
  cruiseController.updateTurnaroundHandoff
)


router.patch(
  '/turnaround-operations/:id/staffing/:departmentRole',
  requireTurnaroundDepartmentAccess('id', 'departmentRole'),
  validate(turnaroundStaffingUpdateSchema),
  cruiseController.updateTurnaroundStaffing
)

router.patch(
  '/turnaround-operations/:id/signoffs/:departmentRole',
  requireTurnaroundDepartmentAccess('id', 'departmentRole'),
  validate(turnaroundSignoffUpdateSchema),
  cruiseController.updateTurnaroundSignoff
)

router.patch(
  '/turnaround-tasks/:id/status',
  requireTurnaroundTaskAccess,
  validate(turnaroundTaskStatusUpdateSchema),
  cruiseController.updateTurnaroundTaskStatus
)

router.patch(
  '/turnaround-tasks/:id/details',
  requireTurnaroundTaskAccess,
  validate(turnaroundTaskDetailUpdateSchema),
  cruiseController.updateTurnaroundTaskDetails
)

router.post(
  '/turnaround-operations/:id/tasks',
  requireTurnaroundDepartmentAccess('id', 'departmentRole'),
  validate(turnaroundTaskCreateSchema),
  cruiseController.createTurnaroundTask
)

router.post(
  '/turnaround-tasks/:id/updates',
  requireTurnaroundTaskAccess,
  validate(turnaroundTaskUpdateSchema),
  cruiseController.createTurnaroundTaskUpdate
)

router.delete(
  '/turnaround-tasks/:id',
  requireTurnaroundTaskAccess,
  cruiseController.deleteTurnaroundTask
)

router.get(
  '/demo-users',
  cruiseController.getDemoUsers
)

router.get(
  '/demo-users/:id/context',
  cruiseController.getDemoUserContext
)

router.get(
  '/customers',
  requireAdminAccess,
  cruiseController.getCustomers
)

router.get(
  '/customers/:id',
  requireCustomerAccess('id'),
  cruiseController.getCustomerById
)

router.get(
  '/customers/:customerId/bookings',
  requireCustomerAccess('customerId'),
  cruiseController.getBookingsByCustomer
)

router.get(
  '/bookings',
  requireAdminAccess,
  cruiseController.getBookings
)

router.get(
  '/bookings/:id',
  requireBookingAccess('id'),
  cruiseController.getBookingById
)

router.post(
  '/customers',
  requireAdminMutation,
  validate(customerSchema),
  cruiseController.insertCustomer
)

router.patch(
  '/customers/:id',
  requireAdminMutation,
  validate(customerSchema.omit({ id: true })),
  cruiseController.updateCustomer
)

router.delete(
  '/customers/:id',
  requireAdminMutation,
  cruiseController.deleteCustomer
)


router.patch(
  '/customers/:id/passenger-profile',
  requireCustomerAccess('id'),
  validate(passengerCustomerUpdateSchema),
  cruiseController.updatePassengerSelfServiceProfile
)

router.patch(
  '/bookings/:bookingId/passengers/:customerId/preferences',
  requireBookingPassengerAccess,
  validate(bookingPreferenceUpdateSchema),
  cruiseController.updatePassengerBookingPreferences
)

router.patch(
  '/customers/:id/pre-cruise-checklist',
  requireCustomerAccess('id'),
  validate(preCruiseChecklistSchema),
  cruiseController.updatePassengerPreCruiseChecklist
)

router.post(
  '/itinerary-favorites',
  requireFavoriteCustomerAccess,
  validate(itineraryFavoriteSchema),
  cruiseController.addItineraryFavorite
)

router.delete(
  '/itinerary-favorites/:customerId/:activityScheduleId',
  requireFavoriteCustomerAccess,
  cruiseController.deleteItineraryFavorite
)


router.post(
  '/bookings',
  requireBookingCreationAccess,
  validate(bookingSchema),
  cruiseController.insertBooking
)

router.patch(
  '/bookings/:id',
  requireAdminMutation,
  validate(bookingSchema.omit({ id: true })),
  cruiseController.updateBooking
)

router.delete(
  '/bookings/:id',
  requireAdminMutation,
  cruiseController.deleteBooking
)

router.post(
  '/bookings/:bookingId/passengers',
  requireAdminMutation,
  validate(bookingPassengerCreateSchema),
  cruiseController.addBookingPassenger
)

router.delete(
  '/bookings/:bookingId/passengers/:customerId',
  requireAdminMutation,
  cruiseController.deleteBookingPassenger
)

router.get(
  '/ship/:shipId/sailings',
  cruiseController.getSailingsByShip
)

router.get(
  '/sailings/:sailingId/itinerary',
  cruiseController.getItineraryBySailing
)

router.post(
  '/cruise-line',
  requireGlobalAdminMutation,
  validate(cruiseLineSchema),
  cruiseController.insertCruiseLine
)

router.post(
  '/ship',
  requireAdminMutation,
  requireCruiseLineTenantAccess('cruiseLineId'),
  validate(shipSchema),
  cruiseController.insertShip
)

router.patch(
  '/cruise-line/:id',
  requireAdminMutation,
  requireCruiseLineTenantAccess('id'),
  validate(cruiseLineSchema),
  cruiseController.updateCruiseLine
)

router.patch(
  '/ship/:id',
  requireAdminMutation,
  requireShipTenantAccess('id'),
  requireCruiseLineTenantAccess('cruiseLineId'),
  validate(shipSchema),
  cruiseController.updateShip
)

router.delete(
  '/cruise-line/:id',
  requireAdminMutation,
  requireCruiseLineTenantAccess('id'),
  cruiseController.deleteCruiseLine
)

router.delete(
  '/ship/:id',
  requireAdminMutation,
  requireShipTenantAccess('id'),
  cruiseController.deleteShip
)


router.post(
  '/ship/:shipId/sailings',
  requireAdminMutation,
  requireShipTenantAccess('shipId'),
  validate(sailingSchema),
  cruiseController.insertSailing
)

router.patch(
  '/sailings/:id',
  requireAdminMutation,
  requireSailingTenantAccess('id'),
  validate(sailingSchema),
  cruiseController.updateSailing
)

router.delete(
  '/sailings/:id',
  requireAdminMutation,
  requireSailingTenantAccess('id'),
  cruiseController.deleteSailing
)

router.post(
  '/sailings/:sailingId/itinerary',
  requireAdminMutation,
  requireSailingTenantAccess('sailingId'),
  validate(itineraryDaySchema),
  cruiseController.insertItineraryDay
)

router.patch(
  '/itinerary-days/:id',
  requireAdminMutation,
  requireItineraryDayTenantAccess('id'),
  cruiseController.updateItineraryDay
)

router.delete(
  '/itinerary-days/:id',
  requireAdminMutation,
  requireItineraryDayTenantAccess('id'),
  cruiseController.deleteItineraryDay
)

router.post(
  '/itinerary-days/:itineraryDayId/activities',
  requireAdminMutation,
  requireItineraryDayTenantAccess('itineraryDayId'),
  validate(activityScheduleSchema),
  cruiseController.insertActivitySchedule
)

router.patch(
  '/activities/:id',
  requireAdminMutation,
  requireActivityTenantAccess('id'),
  cruiseController.updateActivitySchedule
)

router.delete(
  '/activities/:id',
  requireAdminMutation,
  requireActivityTenantAccess('id'),
  cruiseController.deleteActivitySchedule
)

module.exports = router