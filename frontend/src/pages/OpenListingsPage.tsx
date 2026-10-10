import { api } from '../api/client'
import { useActor } from '../actor/ActorContext'
import { ActionFeedback } from '../components/ActionFeedback'
import { ReasonList } from '../components/ReasonList'
import { useAction } from '../hooks/useAction'
import { useApi } from '../hooks/useApi'
import { formatShiftTime, shiftHours } from '../lib/format'

// Staff: shifts colleagues have posted. The server already worked out whether
// I can claim each one and why not, so this page only displays it.
export function OpenListingsPage() {
  const { actor } = useActor()
  const open = useApi(api.openListings)
  const claimed = useApi(api.claimedListings)
  const action = useAction(() => {
    open.reload()
    claimed.reload()
  })

  if ((open.loading && !open.data) || (claimed.loading && !claimed.data)) {
    return <p className="muted">Loading listings…</p>
  }
  if (open.error || claimed.error) return <p className="error">{open.error ?? claimed.error}</p>

  const myClaims = (claimed.data ?? []).filter((listing) => listing.claimerId === actor?.id)
  const certifications = actor?.certifications.length ? actor.certifications.join(', ') : 'none'

  return (
    <section>
      <h1>Open listings</h1>
      <p className="muted">Your certifications: {certifications}</p>
      <ActionFeedback notice={action.notice} error={action.error} />

      {myClaims.length > 0 && (
        <>
          <h2>My claims, waiting for a manager</h2>
          <table className="table">
            <tbody>
              {myClaims.map((listing) => (
                <tr key={listing.id}>
                  <td className="mono">{listing.shiftId}</td>
                  <td>{formatShiftTime(listing.shift)}</td>
                  <td>from {listing.poster.name}</td>
                  <td className="actions">
                    <button
                      className="button secondary"
                      disabled={action.busy}
                      onClick={() =>
                        action.run(() => api.listingAction(listing.id, 'unclaim'), `Unclaimed ${listing.shiftId}`)
                      }
                    >
                      Unclaim
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Available to claim</h2>
      {open.data?.length === 0 ? (
        <p className="empty">No open listings right now.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Shift</th>
              <th>When</th>
              <th>Hours</th>
              <th>Needs</th>
              <th>Posted by</th>
              <th>Can I claim it?</th>
            </tr>
          </thead>
          <tbody>
            {open.data?.map((listing) => (
              <tr key={listing.id}>
                <td className="mono">{listing.shiftId}</td>
                <td>{formatShiftTime(listing.shift)}</td>
                <td>{shiftHours(listing.shift)}h</td>
                <td>{listing.shift.requiredCertification ?? <span className="muted">None</span>}</td>
                <td>{listing.poster.name}</td>
                <td>
                  {listing.canClaim ? (
                    <button
                      className="button"
                      disabled={action.busy}
                      onClick={() =>
                        action.run(
                          () => api.listingAction(listing.id, 'claim'),
                          `Claimed ${listing.shiftId}. A manager now needs to approve it.`,
                        )
                      }
                    >
                      Claim
                    </button>
                  ) : (
                    <ReasonList reasons={listing.reasons} />
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
