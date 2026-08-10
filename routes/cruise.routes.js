const express = require('express')

const cruiseController = require('../controllers/cruise.controller')
const validate = require('../middleware/validate.middleware')
const {
  requireAdminAccess,
  requireAdminMutation,
  requireBookingAccess,
  requireBookingCreationAccess,
  requireBookingPassengerAccess,
  requireCustomerAccess,
  requireFavoriteCustomerAccess
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
  cruiseController.getTurnaroundOperations
)

router.get(
  '/turnaround-operations/:id/audit-events',
  cruiseController.getTurnaroundOperationAuditEvents
)


router.patch(
  '/turnaround-operations/:id',
  validate(turnaroundOperationCommandUpdateSchema),
  cruiseController.updateTurnaroundOperationCommand
)


router.post(
  '/turnaround-operations/:id/escalations',
  validate(turnaroundEscalationCreateSchema),
  cruiseController.createTurnaroundEscalation
)

router.patch(
  '/turnaround-escalations/:id',
  validate(turnaroundEscalationUpdateSchema),
  cruiseController.updateTurnaroundEscalation
)

router.patch(
  '/turnaround-handoffs/:id',
  validate(turnaroundHandoffUpdateSchema),
  cruiseController.updateTurnaroundHandoff
)


router.patch(
  '/turnaround-operations/:id/staffing/:departmentRole',
  validate(turnaroundStaffingUpdateSchema),
  cruiseController.updateTurnaroundStaffing
)

router.patch(
  '/turnaround-operations/:id/signoffs/:departmentRole',
  validate(turnaroundSignoffUpdateSchema),
  cruiseController.updateTurnaroundSignoff
)

router.patch(
  '/turnaround-tasks/:id/status',
  validate(turnaroundTaskStatusUpdateSchema),
  cruiseController.updateTurnaroundTaskStatus
)

router.patch(
  '/turnaround-tasks/:id/details',
  validate(turnaroundTaskDetailUpdateSchema),
  cruiseController.updateTurnaroundTaskDetails
)

router.post(
  '/turnaround-operations/:id/tasks',
  validate(turnaroundTaskCreateSchema),
  cruiseController.createTurnaroundTask
)

router.post(
  '/turnaround-tasks/:id/updates',
  validate(turnaroundTaskUpdateSchema),
  cruiseController.createTurnaroundTaskUpdate
)

router.delete(
  '/turnaround-tasks/:id',
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
  requireAdminMutation,
  validate(cruiseLineSchema),
  cruiseController.insertCruiseLine
)

router.post(
  '/ship',
  requireAdminMutation,
  validate(shipSchema),
  cruiseController.insertShip
)

router.patch(
  '/cruise-line/:id',
  requireAdminMutation,
  validate(cruiseLineSchema),
  cruiseController.updateCruiseLine
)

router.patch(
  '/ship/:id',
  requireAdminMutation,
  validate(shipSchema),
  cruiseController.updateShip
)

router.delete(
  '/cruise-line/:id',
  requireAdminMutation,
  cruiseController.deleteCruiseLine
)

router.delete(
  '/ship/:id',
  requireAdminMutation,
  cruiseController.deleteShip
)


router.post(
  '/ship/:shipId/sailings',
  requireAdminMutation,
  validate(sailingSchema),
  cruiseController.insertSailing
)

router.patch(
  '/sailings/:id',
  requireAdminMutation,
  validate(sailingSchema),
  cruiseController.updateSailing
)

router.delete(
  '/sailings/:id',
  requireAdminMutation,
  cruiseController.deleteSailing
)

router.post(
  '/sailings/:sailingId/itinerary',
  requireAdminMutation,
  validate(itineraryDaySchema),
  cruiseController.insertItineraryDay
)

router.patch(
  '/itinerary-days/:id',
  requireAdminMutation,
  cruiseController.updateItineraryDay
)

router.delete(
  '/itinerary-days/:id',
  requireAdminMutation,
  cruiseController.deleteItineraryDay
)

router.post(
  '/itinerary-days/:itineraryDayId/activities',
  requireAdminMutation,
  validate(activityScheduleSchema),
  cruiseController.insertActivitySchedule
)

router.patch(
  '/activities/:id',
  requireAdminMutation,
  cruiseController.updateActivitySchedule
)

router.delete(
  '/activities/:id',
  requireAdminMutation,
  cruiseController.deleteActivitySchedule
)

module.exports = router