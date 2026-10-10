import type { Shift } from '../api/types'

// Shift times are plain "YYYY-MM-DDTHH:MM" strings in clinic time. We format
// them by hand (with UTC maths) so the browser's own time zone never shifts them.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toUtcMs(value: string) {
  const [date, time] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return Date.UTC(year, month - 1, day, hour, minute)
}

function formatDay(value: string) {
  const date = new Date(toUtcMs(value))
  return `${DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

const timeOf = (value: string) => value.split('T')[1]

// "Mon 2 Mar, 07:00–15:00", or "Mon 2 Mar, 23:00 – Tue 3 Mar, 07:00" for night shifts
export function formatShiftTime(shift: Pick<Shift, 'start' | 'end'>) {
  const startDay = formatDay(shift.start)
  const endDay = formatDay(shift.end)
  if (startDay === endDay) return `${startDay}, ${timeOf(shift.start)}–${timeOf(shift.end)}`
  return `${startDay}, ${timeOf(shift.start)} – ${endDay}, ${timeOf(shift.end)}`
}

// Split for two-line display: { day: 'Mon 2 Mar', time: '23:00 – 07:00 (next day)' }
export function shiftParts(shift: Pick<Shift, 'start' | 'end'>) {
  const sameDay = formatDay(shift.start) === formatDay(shift.end)
  const time = sameDay
    ? `${timeOf(shift.start)}–${timeOf(shift.end)}`
    : `${timeOf(shift.start)} – ${timeOf(shift.end)} (next day)`
  return { day: formatDay(shift.start), time }
}

export function shiftHours(shift: Pick<Shift, 'start' | 'end'>) {
  return (toUtcMs(shift.end) - toUtcMs(shift.start)) / 3_600_000
}

// History timestamps are real ISO dates from the server.
export function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString()
}
