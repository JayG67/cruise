const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const db = require('../db')
const { eq } = require('drizzle-orm')

exports.getCruiseLines = async (req, res) => {
  const cruiseLines = await db.select().from(cruiseLineTable).all()
  if (!cruiseLines || cruiseLines.length === 0) {
    return res.status(404).json({ message: 'No cruise lines found' })
  }
  return res.status(200).json(cruiseLines)
}

exports.getCruiseLineById = async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ message: 'Cruise line ID is required' })
  }

  const cruiseLine = await db
    .select()
    .from(cruiseLineTable)
    .where(eq(cruiseLineTable.id, id))
    .get()

  if (!cruiseLine || cruiseLine.length === 0) {
    return res.status(404).json({ message: 'Cruise line not found' })
  }

  return res.status(200).json(cruiseLine)
}

exports.getShipsByCruiseLine = async (req, res) => {
  const { cruiseLineId } = req.params
  const ships = await db.select().from(shipTable).where(eq(shipTable.cruiseLineId, cruiseLineId)).all()
  if (!ships || ships.length === 0) {
    return res.status(404).json({ message: 'No ships found for the specified cruise line' })
  }
  return res.status(200).json(ships)
}

exports.insertCruiseLine = async (req, res) => {
  const { name, country, website } = req.body
  if (!name || name === '') {
    return res.status(400).json({ message: 'Cruise line name is required' })
  }
  if (await db.select().from(cruiseLineTable).where(eq(cruiseLineTable.name, name)).get()) {
    return res.status(400).json({ message: 'Cruise line with the same name already exists' })
  }
  const id = await db.insert(cruiseLineTable).values({ name, country, website }).returning({ id: cruiseLineTable.id }).get()
  return res.status(201).json({ message: 'Cruise line created successfully', id })
}

exports.insertShip = async (req, res) => {
  const { name, cruiseLineId } = req.body
  if (!name || name === '') {
    return res.status(400).json({ message: 'Ship name is required' })
  }
  if (!cruiseLineId) {
    return res.status(400).json({ message: 'Cruise line ID is required' })
  }
  if (await db.select().from(shipTable).where(eq(shipTable.name, name)).get()) {
    return res.status(400).json({ message: 'Ship with the same name already exists' })
  }
  if (await !db.select().from(cruiseLineTable).where(eq(cruiseLineTable.id, cruiseLineId)).get()) {
    return res.status(400).json({ message: 'Invalid cruise line ID' })
  }
  const id = await db.insert(shipTable).values({ name, cruiseLineId }).returning({ id: shipTable.id }).get()
  return res.status(201).json({ message: 'Ship created successfully', id })
}

exports.updateCruiseLine = async (req, res) => {
  const { id } = req.params
  const { name, country, website } = req.body
  if (!id) {
    return res.status(400).json({ message: 'Cruise line ID is required' })
  }
  if (await !db.select().from(cruiseLineTable).where(eq(cruiseLineTable.id, id)).get()) {
    return res.status(404).json({ message: 'Cruise line not found' })
  }
  await db.update(cruiseLineTable).set({ name, country, website }).where(eq(cruiseLineTable.id, id)).run()
  return res.status(200).json({ message: 'Cruise line updated successfully' })
}

exports.updateShip = async (req, res) => {
  const { id } = req.params
  const { name, cruiseLineId } = req.body
  if (!id) {
    return res.status(400).json({ message: 'Ship ID is required' })
  }
  if (await !db.select().from(shipTable).where(eq(shipTable.id, id)).get()) {
    return res.status(404).json({ message: 'Ship not found' })
  }
  if (cruiseLineId && !db.select().from(cruiseLineTable).where(eq(cruiseLineTable.id, cruiseLineId)).get()) {
    return res.status(400).json({ message: 'Invalid cruise line ID' })
  }
  await db.update(shipTable).set({ name, cruiseLineId }).where(eq(shipTable.id, id)).run()
  return res.status(200).json({ message: 'Ship updated successfully' })
}

exports.deleteCruiseLine = async (req, res) => {
  const { id } = req.params
  if (await !db.select().from(cruiseLineTable).where(eq(cruiseLineTable.id, id)).get()) {
    return res.status(404).json({ message: 'Cruise line not found' })
  }
  await db.delete(shipTable).where(eq(shipTable.cruiseLineId, id)).run()
  await db.delete(cruiseLineTable).where(eq(cruiseLineTable.id, id)).run()
  return res.status(200).json({ message: 'Cruise line deleted successfully' })
}

exports.deleteShip = async (req, res) => {
  const { id } = req.params
  if (await !db.select().from(shipTable).where(eq(shipTable.id, id)).get()) {
    return res.status(404).json({ message: 'Ship not found' })
  }
  await db.delete(shipTable).where(eq(shipTable.id, id)).run()
  return res.status(200).json({ message: 'Ship deleted successfully' })
}