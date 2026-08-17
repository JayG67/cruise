const {
  buildChangedFields,
  buildEntityHistoryPayload,
  buildEntityLifecycleTimestamps,
  buildEntityUpdateTimestamp,
  normalizeAuditValue
} = require('../../services/entityHistory.service')

describe('entity history service', () => {
  it('normalizes audit values for deterministic before and after comparisons', () => {
    expect(normalizeAuditValue(undefined)).toBeNull()
    expect(normalizeAuditValue(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01T00:00:00.000Z')
  })

  it('builds changed field maps while ignoring timestamp bridge noise', () => {
    expect(buildChangedFields(
      { name: 'Old Ship', currentPort: 'Miami', updatedAt: 'old' },
      { name: 'New Ship', currentPort: 'Miami', updatedAt: 'new' }
    )).toEqual({
      name: {
        previous: 'Old Ship',
        next: 'New Ship'
      }
    })
  })

  it('builds an entity history payload with refs and metadata', () => {
    const payload = buildEntityHistoryPayload({
      previous: { bookingStatus: 'CONFIRMED' },
      next: { bookingStatus: 'CHECKED_IN' },
      entityRefs: { bookingId: 'B100' },
      metadata: { operation: 'update' }
    })

    expect(payload).toEqual(expect.objectContaining({
      previous: { bookingStatus: 'CONFIRMED' },
      next: { bookingStatus: 'CHECKED_IN' },
      entityRefs: { bookingId: 'B100' },
      metadata: { operation: 'update' }
    }))
    expect(payload.changedFields.bookingStatus).toEqual({ previous: 'CONFIRMED', next: 'CHECKED_IN' })
  })

  it('builds lifecycle and update timestamp bridge values', () => {
    expect(buildEntityLifecycleTimestamps('2026-01-01T00:00:00.000Z')).toEqual({
      createdAt: '2026-01-01T00:00:00.000Z',
      createdAtTimestamp: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: '2026-01-01T00:00:00.000Z',
      updatedAtTimestamp: new Date('2026-01-01T00:00:00.000Z')
    })

    expect(buildEntityUpdateTimestamp('2026-01-02T00:00:00.000Z')).toEqual({
      updatedAt: '2026-01-02T00:00:00.000Z',
      updatedAtTimestamp: new Date('2026-01-02T00:00:00.000Z')
    })
  })
})

describe('entity history branch coverage', () => {
  it('keeps non-Date values unchanged and normalizes missing sides to null', () => {
    expect(normalizeAuditValue(null)).toBeNull()
    expect(normalizeAuditValue('value')).toBe('value')
    expect(buildChangedFields({ field: 'value', removed: 'old' }, { field: 'value', added: 'new' })).toEqual({
      removed: { previous: 'old', next: null },
      added: { previous: null, next: 'new' }
    })
  })

  it('returns no changedFields when either lifecycle side is absent', () => {
    expect(buildEntityHistoryPayload({ previous: { name: 'Old' }, next: null }).changedFields).toEqual({})
    expect(buildEntityHistoryPayload({ previous: null, next: { name: 'New' } }).changedFields).toEqual({})
    expect(buildEntityHistoryPayload()).toEqual({ previous: null, next: null, changedFields: {}, entityRefs: {}, metadata: {} })
  })

  it('uses valid current timestamp defaults when lifecycle timestamp arguments are omitted', () => {
    const lifecycle = buildEntityLifecycleTimestamps()
    const update = buildEntityUpdateTimestamp()

    expect(Number.isNaN(lifecycle.createdAtTimestamp.getTime())).toBe(false)
    expect(lifecycle.createdAtTimestamp.toISOString()).toBe(lifecycle.createdAt)
    expect(update.updatedAtTimestamp.toISOString()).toBe(update.updatedAt)
  })
})
