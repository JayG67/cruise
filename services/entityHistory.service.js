const AUDIT_IGNORED_FIELDS = new Set([
  'createdAt',
  'createdAtTimestamp',
  'updatedAt',
  'updatedAtTimestamp'
])

function normalizeAuditValue(value) {
  if (value instanceof Date) return value.toISOString()
  if (value === undefined) return null
  return value
}

function buildChangedFields(previous = {}, next = {}) {
  const changedFields = {}
  const fieldNames = new Set([
    ...Object.keys(previous || {}),
    ...Object.keys(next || {})
  ])

  for (const fieldName of fieldNames) {
    if (AUDIT_IGNORED_FIELDS.has(fieldName)) continue

    const previousValue = normalizeAuditValue(previous?.[fieldName])
    const nextValue = normalizeAuditValue(next?.[fieldName])

    if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
      changedFields[fieldName] = {
        previous: previousValue,
        next: nextValue
      }
    }
  }

  return changedFields
}

function buildEntityHistoryPayload({ previous = null, next = null, entityRefs = {}, metadata = {} } = {}) {
  return {
    previous,
    next,
    changedFields: previous && next ? buildChangedFields(previous, next) : {},
    entityRefs,
    metadata
  }
}

function buildEntityLifecycleTimestamps(timestamp = new Date().toISOString()) {
  const date = new Date(timestamp)
  return {
    createdAt: timestamp,
    createdAtTimestamp: date,
    updatedAt: timestamp,
    updatedAtTimestamp: date
  }
}

function buildEntityUpdateTimestamp(timestamp = new Date().toISOString()) {
  return {
    updatedAt: timestamp,
    updatedAtTimestamp: new Date(timestamp)
  }
}

module.exports = {
  AUDIT_IGNORED_FIELDS,
  buildChangedFields,
  buildEntityHistoryPayload,
  buildEntityLifecycleTimestamps,
  buildEntityUpdateTimestamp,
  normalizeAuditValue
}
