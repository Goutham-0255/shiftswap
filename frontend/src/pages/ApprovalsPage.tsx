import { api } from '../api/client'
import { ActionFeedback } from '../components/ActionFeedback'
import { useAction } from '../hooks/useAction'
import { useApi } from '../hooks/useApi'
import { formatShiftTime, shiftHours } from '../lib/format'

// Managers: claims waiting for a decision. Approving re-checks the labour
// rules on the server; if they fail, the reasons are shown and the claim stays.
export function ApprovalsPage() {
  const { data: listings, loading, error, reload } = useApi(api.claimedListings)
  const action = useAction(reload)

  if (loading && !listings) return <p className="muted">Loading claims…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section>
      <h1>Approvals</h1>
      <p className="muted">Approving moves the shift to the person who claimed it.</p>
      <ActionFeedback notice={action.notice} error={action.error} />

      {listings?.length === 0 ? (
        <p className="empty">No claims waiting for approval.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Shift</th>
              <th>When</th>
              <th>Hours</th>
              <th>Needs</th>
              <th>From</th>
              <th>To</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {listings?.map((listing) => (
              <tr key={listing.id}>
                <td className="mono">{listing.shiftId}</td>
                <td>{formatShiftTime(listing.shift)}</td>
                <td>{shiftHours(listing.shift)}h</td>
                <td>{listing.shift.requiredCertification ?? <span className="muted">None</span>}</td>
                <td>{listing.poster.name}</td>
                <td>{listing.claimer?.name}</td>
                <td className="actions">
                  <button
                    className="button"
                    disabled={action.busy}
                    onClick={() =>
                      action.run(
                        () => api.listingAction(listing.id, 'approve'),
                        `Approved: ${listing.shiftId} now belongs to ${listing.claimer?.name}`,
                      )
                    }
                  >
                    Approve
                  </button>{' '}
                  <button
                    className="button danger"
                    disabled={action.busy}
                    onClick={() =>
                      action.run(
                        () => api.listingAction(listing.id, 'reject'),
                        `Rejected: ${listing.shiftId} is open again`,
                      )
                    }
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
