export function formatAuditEventType(eventType = '') {
  return String(eventType || '').toLowerCase().split('_').filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Audit event'
}

export function formatAuditEventPayload(event = {}) {
  const payload = event.eventPayload
  if (!payload || typeof payload !== 'object') return ''
  const changedFields = Object.keys(payload.next || payload).filter(fieldName => !['id', 'operationId'].includes(fieldName))
  if (changedFields.length === 0) return ''
  return `Changed ${changedFields.slice(0, 4).join(', ')}${changedFields.length > 4 ? '…' : ''}`
}

export function formatOperationalTimelineSource(source = '') {
  return String(source || '').toLowerCase().split('_').filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Operation'
}

export function formatOperationalTimelineTime(item = {}) {
  if (item.dueTime) return `Due ${item.dueTime}`
  if (!item.occurredAt) return 'Time pending'
  const date = new Date(item.occurredAt)
  if (Number.isNaN(date.getTime())) return String(item.occurredAt)
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function getOperationalMetricTone(status = '') {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'ACTION') return 'action'
  if (normalized === 'WATCH') return 'watch'
  return 'pass'
}

export function getOperationalTimelineTone(item = {}) {
  const severity = String(item.severity || '').toLowerCase()
  const status = String(item.status || '').toLowerCase()
  if (['critical', 'blocked'].includes(severity) || status === 'blocked') return 'critical'
  if (['action', 'watch'].includes(severity) || ['pending', 'open', 'gap', 'active'].includes(status)) return 'action'
  if (severity === 'success' || ['complete', 'approved', 'cleared', 'covered', 'resolved'].includes(status)) return 'success'
  return 'info'
}
