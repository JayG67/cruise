const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const db = require('../db')
const { eq } = require('drizzle-orm')

exports.getCruiseLines = async (req, res, next) => {
  try {
    const cruiseLines = await db.select().from(cruiseLineTable)

    if (!cruiseLines || cruiseLines.length === 0) {
      return res.status(404).json({ message: 'No cruise lines found' })
    }

    return res.status(200).json(cruiseLines)
  } catch (err) {
    next(err)
  }
}

exports.getCruiseLineById = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Cruise line ID is required' })
    }

    const rows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, id))
      .limit(1)

    const cruiseLine = rows[0]

    if (!cruiseLine) {
      return res.status(404).json({ message: 'Cruise line not found' })
    }

    return res.status(200).json(cruiseLine)
  } catch (err) {
    next(err)
  }
}

exports.getShipsByCruiseLine = async (req, res, next) => {
  try {
    const { cruiseLineId } = req.params

    const ships = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.cruiseLineId, cruiseLineId))

    if (!ships || ships.length === 0) {
      return res.status(404).json({ message: 'No ships found for the specified cruise line' })
    }

    return res.status(200).json(ships)
  } catch (err) {
    next(err)
  }
}

exports.insertCruiseLine = async (req, res, next) => {
  try {
    const { name, country, website } = req.body

    const existingRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.name, name))
      .limit(1)

    if (existingRows[0]) {
      return res.status(400).json({ message: 'Cruise line with the same name already exists' })
    }

    const insertedRows = await db
      .insert(cruiseLineTable)
      .values({ name, country, website })
      .returning({ id: cruiseLineTable.id })

    return res.status(201).json({
      message: 'Cruise line created successfully',
      id: insertedRows[0].id
    })
  } catch (err) {
    next(err)
  }
}

exports.insertShip = async (req, res, next) => {
  try {
    const { name, cruiseLineId } = req.body

    const existingShipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.name, name))
      .limit(1)

    if (existingShipRows[0]) {
      return res.status(400).json({ message: 'Ship with the same name already exists' })
    }

    const existingCruiseLineRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, cruiseLineId))
      .limit(1)

    if (!existingCruiseLineRows[0]) {
      return res.status(400).json({ message: 'Invalid cruise line ID' })
    }

    const insertedRows = await db
      .insert(shipTable)
      .values({ name, cruiseLineId })
      .returning({ id: shipTable.id })

    return res.status(201).json({
      message: 'Ship created successfully',
      id: insertedRows[0].id
    })
  } catch (err) {
    next(err)
  }
}

exports.updateCruiseLine = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, country, website } = req.body

    if (!id) {
      return res.status(400).json({ message: 'Cruise line ID is required' })
    }

    const existingRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Cruise line not found' })
    }

    const duplicateNameRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.name, name))
      .limit(1)

    if (duplicateNameRows[0] && duplicateNameRows[0].id !== id) {
      return res.status(400).json({ message: 'Cruise line with the same name already exists' })
    }

    await db
      .update(cruiseLineTable)
      .set({ name, country, website })
      .where(eq(cruiseLineTable.id, id))

    return res.status(200).json({ message: 'Cruise line updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.updateShip = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, cruiseLineId } = req.body

    if (!id) {
      return res.status(400).json({ message: 'Ship ID is required' })
    }

    const existingShipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, id))
      .limit(1)

    if (!existingShipRows[0]) {
      return res.status(404).json({ message: 'Ship not found' })
    }

    const duplicateShipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.name, name))
      .limit(1)

    if (duplicateShipRows[0] && duplicateShipRows[0].id !== id) {
      return res.status(400).json({ message: 'Ship with the same name already exists' })
    }

    const existingCruiseLineRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, cruiseLineId))
      .limit(1)

    if (!existingCruiseLineRows[0]) {
      return res.status(400).json({ message: 'Invalid cruise line ID' })
    }

    await db
      .update(shipTable)
      .set({ name, cruiseLineId })
      .where(eq(shipTable.id, id))

    return res.status(200).json({ message: 'Ship updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteCruiseLine = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Cruise line ID is required' })
    }

    const existingRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Cruise line not found' })
    }

    await db
      .delete(shipTable)
      .where(eq(shipTable.cruiseLineId, id))

    await db
      .delete(cruiseLineTable)
      .where(eq(cruiseLineTable.id, id))

    return res.status(200).json({ message: 'Cruise line deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteShip = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Ship ID is required' })
    }

    const existingRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Ship not found' })
    }

    await db
      .delete(shipTable)
      .where(eq(shipTable.id, id))

    return res.status(200).json({ message: 'Ship deleted successfully' })
  } catch (err) {
    next(err)
  }
}