import { AppError } from '../../lib/AppError';

export type ListingStatus = 'OPEN' | 'CLAIMED' | 'WITHDRAWN' | 'APPROVED';
export type ListingAction = 'POST' | 'WITHDRAW' | 'CLAIM' | 'UNCLAIM' | 'APPROVE' | 'REJECT';

// A shift can have at most one listing in one of these statuses at a time.
export const ACTIVE_STATUSES: ListingStatus[] = ['OPEN', 'CLAIMED'];

// Every allowed status change, in one table. Anything not listed here is refused.
export const TRANSITIONS: Record<Exclude<ListingAction, 'POST'>, { from: ListingStatus; to: ListingStatus }> = {
  WITHDRAW: { from: 'OPEN', to: 'WITHDRAWN' },
  CLAIM: { from: 'OPEN', to: 'CLAIMED' },
  UNCLAIM: { from: 'CLAIMED', to: 'OPEN' },
  APPROVE: { from: 'CLAIMED', to: 'APPROVED' },
  REJECT: { from: 'CLAIMED', to: 'OPEN' },
};

export function assertTransition(action: Exclude<ListingAction, 'POST'>, current: string) {
  const { from } = TRANSITIONS[action];
  if (current === from) return TRANSITIONS[action];

  // The spec's exact wording for a claim on a listing that is no longer open.
  if (action === 'CLAIM') throw AppError.conflict('This listing is no longer available');
  throw AppError.conflict(`Cannot ${action.toLowerCase()} a listing that is ${current} (must be ${from})`);
}
