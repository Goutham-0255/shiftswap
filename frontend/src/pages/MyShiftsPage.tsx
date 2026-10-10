import { api } from '../api/client'
import { ActionFeedback } from '../components/ActionFeedback'
import { CertTag } from '../components/CertTag'
import { PageHeader } from '../components/PageHeader'
import { ShiftWhen } from '../components/ShiftWhen'
import { StatusBadge } from '../components/StatusBadge'
import { useAction } from '../hooks/useAction'
import { useApi } from '../hooks/useApi'

// Staff: my assigned shifts. Post one I cannot work, or withdraw it while still open.
export function MyShiftsPage() {
  const { data: shifts, loading, error, reload } = useApi(api.myShifts)
  const action = useAction(reload)

  if (loading && !shifts) return <p className="muted">Loading your shifts…</p>
  if (error) return <p className="error">{error}</p>

  const posted = shifts?.filter((shift) => shift.activeListing).length ?? 0

  return (
    <section>
      <PageHeader
        title="My shifts"
        count={`${shifts?.length ?? 0} shifts · ${posted} posted`}
        subtitle="Post a shift you cannot work so a colleague can claim it."
      />
      <ActionFeedback notice={action.notice} error={action.error} onDismiss={action.clear} />

      {shifts && shifts.length === 0 ? (
        <p className="empty">You have no shifts.</p>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Shift</th>
                <th>When</th>
                <th>Needs</th>
                <th>Listing</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shifts?.map((shift) => {
                const listing = shift.activeListing
                return (
                  <tr key={shift.id}>
                    <td className="mono">{shift.id}</td>
                    <td>
                      <ShiftWhen shift={shift} />
                    </td>
                    <td>
                      <CertTag cert={shift.requiredCertification} />
                    </td>
                    <td>
                      {listing ? (
                        <>
                          <StatusBadge status={listing.status} />
                          {listing.claimer && (
                            <div className="muted small">
                              by {listing.claimer.name}, waiting for a manager
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="muted">Not posted</span>
                      )}
                    </td>
                    <td className="actions">
                      {!listing && (
                        <button
                          className="button"
                          disabled={action.busy}
                          onClick={() => action.run(() => api.postShift(shift.id), `Posted ${shift.id}`)}
                        >
                          Post
                        </button>
                      )}
                      {listing?.status === 'OPEN' && (
                        <button
                          className="button secondary"
                          disabled={action.busy}
                          onClick={() =>
                            action.run(() => api.listingAction(listing.id, 'withdraw'), `Withdrew ${shift.id}`)
                          }
                        >
                          Withdraw
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
