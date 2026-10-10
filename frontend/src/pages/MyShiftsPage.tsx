import { api } from '../api/client'
import { ActionFeedback } from '../components/ActionFeedback'
import { StatusBadge } from '../components/StatusBadge'
import { useAction } from '../hooks/useAction'
import { useApi } from '../hooks/useApi'
import { formatShiftTime, shiftHours } from '../lib/format'

// Staff: my assigned shifts. Post one I cannot work, or withdraw it while still open.
export function MyShiftsPage() {
  const { data: shifts, loading, error, reload } = useApi(api.myShifts)
  const action = useAction(reload)

  if (loading && !shifts) return <p className="muted">Loading your shifts…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section>
      <h1>My shifts</h1>
      <p className="muted">Post a shift you cannot work so a colleague can claim it.</p>
      <ActionFeedback notice={action.notice} error={action.error} />

      {shifts && shifts.length === 0 ? (
        <p className="empty">You have no shifts.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Shift</th>
              <th>When</th>
              <th>Hours</th>
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
                  <td>{formatShiftTime(shift)}</td>
                  <td>{shiftHours(shift)}h</td>
                  <td>{shift.requiredCertification ?? <span className="muted">None</span>}</td>
                  <td>
                    {listing ? (
                      <>
                        <StatusBadge status={listing.status} />
                        {listing.claimer && (
                          <span className="muted"> by {listing.claimer.name}, waiting for a manager</span>
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
      )}
    </section>
  )
}
