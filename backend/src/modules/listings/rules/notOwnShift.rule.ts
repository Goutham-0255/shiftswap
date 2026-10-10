import type { ClaimRule } from './types';

export const notOwnShiftRule: ClaimRule = {
  rule: 1,
  description: 'You cannot claim your own shift',
  check: ({ claimerId, shift }) =>
    claimerId === shift.assignedToId ? [{ rule: 1, message: 'You cannot claim your own shift' }] : [],
};
