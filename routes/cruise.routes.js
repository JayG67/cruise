const express = require('express')

const cruiseController = require('../controllers/cruise.controller')
const validate = require('../middleware/validate.middleware')

const {
  cruiseLineSchema,
  shipSchema
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

module.exports = router