const { normalizeTimestamp } = require('../../services/dateTimeNormalization.service')

describe('dateTimeNormalization', () => {
  test('normalizes timestamps to an ISO-8601 UTC value', () => {
    expect(normalizeTimestamp('2026-01-01T10:00:00Z'))
      .toBe('2026-01-01T10:00:00.000Z')
  })

  test.each([undefined, null, '', 0])('returns null for an empty timestamp value', value => {
    expect(normalizeTimestamp(value)).toBeNull()
  })

  test('preserves an equivalent instant that includes a timezone offset', () => {
    expect(normalizeTimestamp('2026-01-01T05:00:00-05:00'))
      .toBe('2026-01-01T10:00:00.000Z')
  })

  test('surfaces invalid timestamps instead of silently storing bad data', () => {
    expect(() => normalizeTimestamp('not-a-date')).toThrow(RangeError)
  })
})
