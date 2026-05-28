export default function ReactFleetDirectory({ cruiseLines = [], isLoading = false, isRefreshing = false, error = '', onRefresh }) {
  const visibleCruiseLines = cruiseLines.slice(0, 8)

  return (
    <section className="react-app-section fleet-directory-section" id="react-fleet" aria-labelledby="react-fleet-heading" data-testid="react-fleet-directory">
      <div className="section-heading-row fleet-heading-row">
        <div>
          <p className="eyebrow">Fleet dashboard</p>
          <h2 id="react-fleet-heading">Cruise Line Directory</h2>
          <p>
            Search, review, and manage the cruise lines currently available in the live application dataset.
          </p>
        </div>
        <button type="button" className="button-link secondary light-action" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing fleet…' : 'Refresh fleet'}
        </button>
      </div>

      <label className="search-control fleet-search-control">
        <span>Search cruise lines</span>
        <input type="search" placeholder="Search cruise lines..." aria-describedby="react-fleet-count" />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {isLoading && <p className="muted-status">Loading cruise line directory…</p>}

      <p id="react-fleet-count" className="muted-status">
        Showing {visibleCruiseLines.length} of {cruiseLines.length} cruise lines.
      </p>

      <div className="fleet-card-grid">
        {visibleCruiseLines.map(cruiseLine => (
          <article className="fleet-card" key={cruiseLine.id || cruiseLine.name}>
            <h3>{cruiseLine.name}</h3>
            <p><strong>Country:</strong> {cruiseLine.country || 'Not provided'}</p>
            {cruiseLine.website && (
              <a href={cruiseLine.website} target="_blank" rel="noreferrer">Visit website</a>
            )}
            <div className="fleet-card-actions" aria-label={`Actions for ${cruiseLine.name}`}>
              <button type="button">View Ships</button>
              <button type="button">Update</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
