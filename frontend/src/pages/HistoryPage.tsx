import { useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/PageHeader'
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
  const [onlyRefused, setOnlyRefused] = useState(false)

  if (loading && !entries) return <p className="muted">Loading history…</p>
  if (error) return <p className="error">{error}</p>

  const refusedCount = entries?.filter((entry) => entry.outcome === 'REFUSED').length ?? 0
  const shown = onlyRefused ? entries?.filter((entry) => entry.outcome === 'REFUSED') : entries

  return (
    <section>
      <PageHeader
        title="History"
        count={`${entries?.length ?? 0} actions · ${refusedCount} refused`}
        subtitle="Every action, including refused ones, newest first."
        actions={
          <button className="button secondary" onClick={reload} disabled={loading}>
            Refresh
          </button>
        }
      />
      <label className="filter">
        <input type="checkbox" checked={onlyRefused} onChange={(e) => setOnlyRefused(e.target.checked)} />
        Only refused actions
      </label>

      {shown?.length === 0 ? (
        <p className="empty">{onlyRefused ? 'No refused actions yet.' : 'Nothing has happened yet.'}</p>
      ) : (
        <div className="card">
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
            {shown?.map((entry) => (
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
        </div>
      )}
    </section>
  )
}
