export default function ReactQueryStatusPanel({
  isLoading = false,
  isRefreshing = false,
  error = '',
  lastLoadedAt = '',
  requestId = 0,
  customerCount = 0,
  bookingCount = 0,
  onRefresh
}) {
  const statusLabel = error
    ? 'React API query failed'
    : isLoading
      ? 'React API query loading'
      : isRefreshing
        ? 'React API query refreshing'
        : 'React API query ready'

  return (
    <section className={error ? 'query-status-card error' : 'query-status-card'} aria-labelledby="react-query-status-heading" data-testid="react-query-status-panel">
      <div>
        <p className="eyebrow">Live API query shell</p>
        <h2 id="react-query-status-heading">{statusLabel}</h2>
        <p role={error ? 'alert' : 'status'} data-testid="react-query-status-message">
          {error || `Loaded ${customerCount} customers and ${bookingCount} bookings from the existing Express API.`}
        </p>
      </div>

      <dl className="query-status-metrics" aria-label="React API query metadata">
        <div>
          <dt>Request</dt>
          <dd data-testid="react-query-request-id">#{requestId}</dd>
        </div>
        <div>
          <dt>Last loaded</dt>
          <dd data-testid="react-query-last-loaded">{lastLoadedAt || 'Not loaded yet'}</dd>
        </div>
      </dl>

      {onRefresh && (
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={isLoading || isRefreshing} data-testid="react-refresh-query">
          {isLoading || isRefreshing ? 'Refreshing API snapshot…' : 'Refresh API snapshot'}
        </button>
      )}
    </section>
  )
}
