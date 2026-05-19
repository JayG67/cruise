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
  bookingPassengerCreateSchema
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
  validate(itineraryDaySchema),
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
  validate(activityScheduleSchema),
  cruiseController.updateActivitySchedule
)

router.delete(
  '/activities/:id',
  cruiseController.deleteActivitySchedule
)

module.exports = router