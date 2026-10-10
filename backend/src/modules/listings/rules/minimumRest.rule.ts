import { MINUTES_PER_HOUR, toMinutes } from '../../../lib/time';
import { overlaps } from './noOverlap.rule';
import type { ClaimRule } from './types';

export const MIN_REST_HOURS = 11;

export const minimumRestRule: ClaimRule = {
  rule: 4,
  description: `At least ${MIN_REST_HOURS} hours between the end of one shift and the start of the next`,
  check: ({ shift, claimerShifts }) =>
    claimerShifts
      // Overlapping shifts are rule 3's job, so they are skipped here.
      .filter((other) => !overlaps(shift, other))
      .flatMap((other) => {
        const [earlier, later] =
          toMinutes(other.start) < toMinutes(shift.start) ? [other, shift] : [shift, other];
        const restHours = (toMinutes(later.start) - toMinutes(earlier.end)) / MINUTES_PER_HOUR;
        if (restHours >= MIN_REST_HOURS) return []; // exactly 11h is allowed
        return [
          {
            rule: 4 as const,
            message: `Only ${restHours}h rest next to your shift ${other.id} (minimum ${MIN_REST_HOURS}h)`,
            conflictingShiftId: other.id,
          },
        ];
      }),
};
