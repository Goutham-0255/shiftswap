import { durationHours, toMinutes, weekStartOf } from '../../../lib/time';
import type { ClaimRule } from './types';

export const MAX_WEEKLY_HOURS = 40;

export const weeklyHoursRule: ClaimRule = {
  rule: 5,
  description: `At most ${MAX_WEEKLY_HOURS} hours in the week the shift starts (Monday to Monday)`,
  check: ({ shift, claimerShifts }) => {
    // A shift belongs to the week in which it starts, even if it ends after midnight Sunday.
    const week = weekStartOf(toMinutes(shift.start));
    const hoursThatWeek = claimerShifts
      .filter((other) => weekStartOf(toMinutes(other.start)) === week)
      .reduce((total, other) => total + durationHours(other.start, other.end), 0);
    const totalWithShift = hoursThatWeek + durationHours(shift.start, shift.end);

    if (totalWithShift <= MAX_WEEKLY_HOURS) return []; // exactly 40h is allowed
    return [
      {
        rule: 5,
        message: `Would make ${totalWithShift}h that week (maximum ${MAX_WEEKLY_HOURS}h)`,
      },
    ];
  },
};
