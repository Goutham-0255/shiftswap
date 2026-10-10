import type { ListingStatus } from '../api/types'

const LABELS: Record<ListingStatus, string> = {
  OPEN: 'Open',
  CLAIMED: 'Claimed',
  WITHDRAWN: 'Withdrawn',
  APPROVED: 'Approved',
}

export function StatusBadge({ status }: { status: ListingStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{LABELS[status]}</span>
}
