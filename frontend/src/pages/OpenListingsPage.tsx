import { api } from '../api/client'
import { useActor } from '../actor/ActorContext'
import { ActionFeedback } from '../components/ActionFeedback'
import { CertTag } from '../components/CertTag'
import { PageHeader } from '../components/PageHeader'
import { ReasonList } from '../components/ReasonList'
import { ShiftWhen } from '../components/ShiftWhen'
import { useAction } from '../hooks/useAction'
import { useApi } from '../hooks/useApi'

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
  const listings = open.data ?? []
  const claimable = listings.filter((listing) => listing.canClaim).length
  const certifications = actor?.certifications.length ? actor.certifications.join(', ') : 'none'

  return (
    <section>
      <PageHeader
        title="Open listings"
        count={`${claimable} you can claim · ${listings.length - claimable} blocked`}
        subtitle={`Shifts colleagues have posted. Your certifications: ${certifications}.`}
      />
      <ActionFeedback notice={action.notice} error={action.error} onDismiss={action.clear} />

      {myClaims.length > 0 && (
        <>
          <h2>My claims, waiting for a manager</h2>
          <div className="card">
            <table className="table">
              <tbody>
                {myClaims.map((listing) => (
                  <tr key={listing.id}>
                    <td className="mono">{listing.shiftId}</td>
                    <td>
                      <ShiftWhen shift={listing.shift} />
                    </td>
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
          </div>
        </>
      )}

      <h2>Available to claim</h2>
      {listings.length === 0 ? (
        <p className="empty">No open listings right now. When a colleague posts a shift, it shows up here.</p>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Shift</th>
                <th>When</th>
                <th>Needs</th>
                <th>Posted by</th>
                <th>Can I claim it?</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className={listing.canClaim ? 'row-ok' : 'row-blocked'}>
                  <td className="mono">{listing.shiftId}</td>
                  <td>
                    <ShiftWhen shift={listing.shift} />
                  </td>
                  <td>
                    <CertTag cert={listing.shift.requiredCertification} />
                  </td>
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
        </div>
      )}
    </section>
  )
}
