const express = require('express')

const cruiseController = require('../controllers/cruise.controller')
const validate = require('../middleware/validate.middleware')

const {
  cruiseLineSchema,
  shipSchema,
  sailingSchema,
  itineraryDaySchema,
  activityScheduleSchema
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