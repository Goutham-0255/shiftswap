// Shift times are local clinic time as "YYYY-MM-DDTHH:MM" with no time zones.
// We convert them to "minutes since epoch" using UTC maths, so the computer's own
// time zone and daylight saving can never change the result.

export const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

export function toMinutes(time: string): number {
  const [date, clock] = time.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = clock.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) / 60_000;
}

// Start of the week (Monday 00:00) that contains the given moment.
export function weekStartOf(minutes: number): number {
  const startOfDay = Math.floor(minutes / MINUTES_PER_DAY) * MINUTES_PER_DAY;
  const dayOfWeek = new Date(minutes * 60_000).getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return startOfDay - daysSinceMonday * MINUTES_PER_DAY;
}

export function durationHours(start: string, end: string): number {
  return (toMinutes(end) - toMinutes(start)) / MINUTES_PER_HOUR;
}
