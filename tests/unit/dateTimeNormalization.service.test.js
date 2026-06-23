const { normalizeTimestamp } = require('../../services/dateTimeNormalization.service');

describe('dateTimeNormalization', () => {
  test('normalizes timestamps', () => {
    expect(normalizeTimestamp('2026-01-01T10:00:00Z'))
      .toBe('2026-01-01T10:00:00.000Z');
  });
});