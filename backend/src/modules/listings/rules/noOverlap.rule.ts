import { toMinutes } from '../../../lib/time';
import type { ClaimRule, ShiftInfo } from './types';

// Two shifts overlap if A.start < B.end and B.start < A.end.
export function overlaps(a: ShiftInfo, b: ShiftInfo): boolean {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

export const noOverlapRule: ClaimRule = {
  rule: 3,
  description: 'Shift must not overlap any shift you already have',
  check: ({ shift, claimerShifts }) =>
    claimerShifts
      .filter((other) => overlaps(shift, other))
      .map((other) => ({
        rule: 3 as const,
        message: `Overlaps your shift ${other.id} (${other.start} to ${other.end})`,
        conflictingShiftId: other.id,
      })),
};
