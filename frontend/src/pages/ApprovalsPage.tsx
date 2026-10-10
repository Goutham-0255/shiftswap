import { api } from '../api/client'
import { ActionFeedback } from '../components/ActionFeedback'
import { CertTag } from '../components/CertTag'
import { PageHeader } from '../components/PageHeader'
import { ShiftWhen } from '../components/ShiftWhen'
import { useAction } from '../hooks/useAction'
import { useApi } from '../hooks/useApi'

// Managers: claims waiting for a decision. Approving re-checks the labour
// rules on the server; if they fail, the reasons are shown and the claim stays.
export function ApprovalsPage() {
  const { data: listings, loading, error, reload } = useApi(api.claimedListings)
  const action = useAction(reload)

  if (loading && !listings) return <p className="muted">Loading claims…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section>
      <PageHeader
        title="Approvals"
        count={`${listings?.length ?? 0} waiting`}
        subtitle="Approving moves the shift to the person who claimed it. The labour rules are checked again first."
      />
      <ActionFeedback notice={action.notice} error={action.error} onDismiss={action.clear} />

      {listings?.length === 0 ? (
        <p className="empty">No claims waiting for approval. You're all caught up.</p>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Shift</th>
                <th>When</th>
                <th>Needs</th>
                <th>Swap</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {listings?.map((listing) => (
                <tr key={listing.id}>
                  <td className="mono">{listing.shiftId}</td>
                  <td>
                    <ShiftWhen shift={listing.shift} />
                  </td>
                  <td>
                    <CertTag cert={listing.shift.requiredCertification} />
                  </td>
                  <td>
                    {listing.poster.name} <span className="muted">→</span> <strong>{listing.claimer?.name}</strong>
                  </td>
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
        </div>
      )}
    </section>
  )
}
