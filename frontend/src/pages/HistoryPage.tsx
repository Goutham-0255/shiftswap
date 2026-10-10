import { api } from '../api/client'
import { ReasonList } from '../components/ReasonList'
import { useApi } from '../hooks/useApi'
import { formatTimestamp } from '../lib/format'

const ACTION_LABELS: Record<string, string> = {
  POST: 'Posted',
  WITHDRAW: 'Withdrew',
  CLAIM: 'Claimed',
  UNCLAIM: 'Unclaimed',
  APPROVE: 'Approved',
  REJECT: 'Rejected',
}

// Everyone: the audit log, newest first. Refused attempts are listed too,
// with the reasons they were refused.
export function HistoryPage() {
  const { data: entries, loading, error, reload } = useApi(api.history)

  if (loading && !entries) return <p className="muted">Loading history…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section>
      <div className="page-title">
        <h1>History</h1>
        <button className="button secondary" onClick={reload} disabled={loading}>
          Refresh
        </button>
      </div>
      <p className="muted">Every action, including refused ones, newest first.</p>

      {entries?.length === 0 ? (
        <p className="empty">Nothing has happened yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>Shift</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {entries?.map((entry) => (
              <tr key={entry.id}>
                <td className="muted">{formatTimestamp(entry.createdAt)}</td>
                <td>
                  {entry.actor.name}
                  {entry.actor.role === 'MANAGER' && <span className="muted"> (manager)</span>}
                </td>
                <td>{ACTION_LABELS[entry.action] ?? entry.action}</td>
                <td className="mono">{entry.shiftId}</td>
                <td>
                  {entry.outcome === 'SUCCESS' ? (
                    <span className="badge badge-approved">Done</span>
                  ) : (
                    <>
                      <span className="badge badge-refused">Refused</span>
                      <ReasonList reasons={entry.reasons} />
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
