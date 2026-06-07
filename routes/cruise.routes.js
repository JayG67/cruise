const express = require('express')

const cruiseController = require('../controllers/cruise.controller')
const validate = require('../middleware/validate.middleware')

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
  turnaroundHandoffUpdateSchema
} = require('../validation/cruise.validation')

const router = express.Router()

router.get('/', cruiseController.getCruiseLines)

router.get(
  '/cruise-line/:id',
  cruiseController.getCruiseLineById
)

router.get(
  '/ships/:cruiseLineId',
  cruiseController.getShipsByCruiseLine
)



router.get(
  '/turnaround-operations',
  cruiseController.getTurnaroundOperations
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
  cruiseController.getCustomers
)

router.get(
  '/customers/:id',
  cruiseController.getCustomerById
)

router.get(
  '/customers/:customerId/bookings',
  cruiseController.getBookingsByCustomer
)

router.get(
  '/bookings',
  cruiseController.getBookings
)

router.get(
  '/bookings/:id',
  cruiseController.getBookingById
)

router.post(
  '/customers',
  validate(customerSchema),
  cruiseController.insertCustomer
)

router.patch(
  '/customers/:id',
  validate(customerSchema.omit({ id: true })),
  cruiseController.updateCustomer
)

router.delete(
  '/customers/:id',
  cruiseController.deleteCustomer
)


router.patch(
  '/customers/:id/passenger-profile',
  validate(passengerCustomerUpdateSchema),
  cruiseController.updatePassengerSelfServiceProfile
)

router.patch(
  '/bookings/:bookingId/passengers/:customerId/preferences',
  validate(bookingPreferenceUpdateSchema),
  cruiseController.updatePassengerBookingPreferences
)

router.post(
  '/itinerary-favorites',
  validate(itineraryFavoriteSchema),
  cruiseController.addItineraryFavorite
)

router.delete(
  '/itinerary-favorites/:customerId/:activityScheduleId',
  cruiseController.deleteItineraryFavorite
)


router.post(
  '/bookings',
  validate(bookingSchema),
  cruiseController.insertBooking
)

router.patch(
  '/bookings/:id',
  validate(bookingSchema.omit({ id: true })),
  cruiseController.updateBooking
)

router.delete(
  '/bookings/:id',
  cruiseController.deleteBooking
)

router.post(
  '/bookings/:bookingId/passengers',
  validate(bookingPassengerCreateSchema),
  cruiseController.addBookingPassenger
)

router.delete(
  '/bookings/:bookingId/passengers/:customerId',
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
  validate(cruiseLineSchema),
  cruiseController.insertCruiseLine
)

router.post(
  '/ship',
  validate(shipSchema),
  cruiseController.insertShip
)

router.patch(
  '/cruise-line/:id',
  validate(cruiseLineSchema),
  cruiseController.updateCruiseLine
)

router.patch(
  '/ship/:id',
  validate(shipSchema),
  cruiseController.updateShip
)

router.delete(
  '/cruise-line/:id',
  cruiseController.deleteCruiseLine
)

router.delete(
  '/ship/:id',
  cruiseController.deleteShip
)


router.post(
  '/ship/:shipId/sailings',
  validate(sailingSchema),
  cruiseController.insertSailing
)

router.patch(
  '/sailings/:id',
  validate(sailingSchema),
  cruiseController.updateSailing
)

router.delete(
  '/sailings/:id',
  cruiseController.deleteSailing
)

router.post(
  '/sailings/:sailingId/itinerary',
  validate(itineraryDaySchema),
  cruiseController.insertItineraryDay
)

router.patch(
  '/itinerary-days/:id',
  cruiseController.updateItineraryDay
)

router.delete(
  '/itinerary-days/:id',
  cruiseController.deleteItineraryDay
)

router.post(
  '/itinerary-days/:itineraryDayId/activities',
  validate(activityScheduleSchema),
  cruiseController.insertActivitySchedule
)

router.patch(
  '/activities/:id',
  cruiseController.updateActivitySchedule
)

router.delete(
  '/activities/:id',
  cruiseController.deleteActivitySchedule
)

module.exports = router