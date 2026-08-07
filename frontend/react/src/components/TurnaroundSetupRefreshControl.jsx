export default function TurnaroundSetupRefreshControl({ isLoading, onReload, status }) {
  return (
    <div className="turnaround-admin-refresh-control ce-command-card" data-testid="react-turnaround-admin-refresh-control">
      <div>
        <strong>Turnaround setup data</strong>
        <p>Reload the latest personnel assignments, ships, and sailing queues from the live setup service.</p>
        <p className="turnaround-admin-refresh-status" role="status" aria-live="polite" data-testid="react-turnaround-admin-refresh-status">{status}</p>
      </div>
      <button type="button" className="secondary-action-button ce-button-secondary" onClick={onReload} disabled={isLoading} data-testid="react-turnaround-admin-refresh-button">
        {isLoading ? 'Reloading setup data...' : 'Reload setup data'}
      </button>
    </div>
  )
}
