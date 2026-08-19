jest.mock('../../db', () => ({ select: jest.fn() }))

const db = require('../../db')
const service = require('../../services/sailingAuditScope.service')

function selectQuery(rows = []) {
  const query = {
    from: jest.fn(() => query),
    where: jest.fn(() => query),
    limit: jest.fn(() => Promise.resolve(rows))
  }
  return query
}

function queueRows(...rowSets) {
  rowSets.forEach(rows => db.select.mockReturnValueOnce(selectQuery(rows)))
}

describe('sailing audit scope service', () => {
  beforeEach(() => jest.clearAllMocks())

  it('resolves sailing scope from an id and a complete provided sailing', async () => {
    queueRows(
      [{ id: 'sailing-1', shipId: 'ship-1' }],
      [{ id: 'ship-1', cruiseLineId: 'line-1' }],
      [{ id: 'ship-2', cruiseLineId: 'line-2' }]
    )

    await expect(service.getSailingAuditScope('sailing-1')).resolves.toEqual({
      cruiseLineId: 'line-1', shipId: 'ship-1', sailingId: 'sailing-1'
    })
    await expect(service.getSailingAuditScope({ id: 'sailing-2', shipId: 'ship-2' })).resolves.toEqual({
      cruiseLineId: 'line-2', shipId: 'ship-2', sailingId: 'sailing-2'
    })
  })

  it('hydrates partial sailing objects instead of treating them as authoritative records', async () => {
    queueRows(
      [{ id: 'sailing-3', shipId: 'ship-3' }],
      [{ id: 'ship-3', cruiseLineId: 'line-3' }]
    )

    await expect(service.getSailingAuditScope({ id: 'sailing-3' })).resolves.toEqual({
      cruiseLineId: 'line-3', shipId: 'ship-3', sailingId: 'sailing-3'
    })
  })

  it('fails sailing scope closed when identifiers or authoritative relationships are missing', async () => {
    await expect(service.getSailingAuditScope()).resolves.toEqual({})

    queueRows([], [{ id: 'sailing-4', shipId: null }])
    await expect(service.getSailingAuditScope('missing-sailing')).resolves.toEqual({ sailingId: 'missing-sailing' })
    await expect(service.getSailingAuditScope('sailing-4')).resolves.toEqual({ sailingId: 'sailing-4' })
  })

  it('hydrates itinerary-day sailing scope so ship and cruise-line attribution are retained', async () => {
    queueRows(
      [{ id: 'sailing-5', shipId: 'ship-5' }],
      [{ id: 'ship-5', cruiseLineId: 'line-5' }]
    )

    await expect(service.getItineraryDayAuditScope({ id: 'day-5', sailingId: 'sailing-5' })).resolves.toEqual({
      cruiseLineId: 'line-5', shipId: 'ship-5', sailingId: 'sailing-5'
    })
  })

  it('resolves itinerary days by id and rejects incomplete day context', async () => {
    await expect(service.getItineraryDayAuditScope()).resolves.toEqual({})

    queueRows(
      [],
      [{ id: 'day-6', sailingId: 'sailing-6' }],
      [{ id: 'sailing-6', shipId: 'ship-6' }],
      [{ id: 'ship-6', cruiseLineId: null }]
    )
    await expect(service.getItineraryDayAuditScope('missing-day')).resolves.toEqual({})
    await expect(service.getItineraryDayAuditScope('day-6')).resolves.toEqual({
      cruiseLineId: null, shipId: 'ship-6', sailingId: 'sailing-6'
    })
  })

  it('resolves activity scope through itinerary day, sailing, and ship and rejects missing activity context', async () => {
    await expect(service.getActivityAuditScope()).resolves.toEqual({})

    queueRows(
      [],
      [{ id: 'activity-1', itineraryDayId: 'day-1' }],
      [{ id: 'day-1', sailingId: 'sailing-1' }],
      [{ id: 'sailing-1', shipId: 'ship-1' }],
      [{ id: 'ship-1', cruiseLineId: 'line-1' }]
    )
    await expect(service.getActivityAuditScope('missing-activity')).resolves.toEqual({})
    await expect(service.getActivityAuditScope('activity-1')).resolves.toEqual({
      cruiseLineId: 'line-1', shipId: 'ship-1', sailingId: 'sailing-1'
    })
  })
})
