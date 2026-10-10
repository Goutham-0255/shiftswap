// Shapes of the JSON the backend sends. Kept in one file so a reader can see
// the whole contract between frontend and backend at a glance.

export type Role = 'STAFF' | 'MANAGER'
export type ListingStatus = 'OPEN' | 'CLAIMED' | 'WITHDRAWN' | 'APPROVED'
export type ListingAction = 'withdraw' | 'claim' | 'unclaim' | 'approve' | 'reject'

export interface Staff {
  id: string
  name: string
  role: Role
  certifications: string[]
}

export interface PersonRef {
  id: string
  name: string
}

export interface Shift {
  id: string
  start: string // "YYYY-MM-DDTHH:MM", local time as given in the data
  end: string
  requiredCertification: string | null
  assignedToId: string
}

// One broken claim rule, e.g. { rule: 3, message: 'Overlaps your shift SH12' }
export interface Violation {
  rule?: number
  message: string
  conflictingShiftId?: string
}

export interface Listing {
  id: number
  shiftId: string
  posterId: string
  claimerId: string | null
  status: ListingStatus
  createdAt: string
  updatedAt: string
  shift: Shift
  poster: PersonRef
  claimer: PersonRef | null
}

// An OPEN listing as seen by the actor: can they claim it, and if not, why.
export interface OpenListing extends Listing {
  canClaim: boolean
  reasons: Violation[]
}

// A CLAIMED listing as seen by a manager: would approval pass right now, and if not why.
export interface ClaimedListing extends Listing {
  canApprove: boolean
  reasons: Violation[]
}

export interface MyShift extends Shift {
  activeListing: {
    id: number
    status: ListingStatus
    claimer: PersonRef | null
  } | null
}

export interface HistoryEntry {
  id: number
  action: string
  shiftId: string
  listingId: number | null
  outcome: 'SUCCESS' | 'REFUSED'
  reasons: Violation[]
  createdAt: string
  actor: PersonRef & { role: Role }
}
