import type { Shift } from '../api/types'
import { shiftHours, weekOf } from '../lib/format'

const MAX_WEEKLY_HOURS = 40 // rule 5; the server enforces it, this card only shows it

// One bar per week: hours assigned vs the 40h limit, so staff see rule 5 coming.
export function WeekSummary({ shifts }: { shifts: Pick<Shift, 'start' | 'end'>[] }) {
  const weeks = new Map<number, { label: string; hours: number }>()
  for (const shift of shifts) {
    const { key, label } = weekOf(shift.start)
    const week = weeks.get(key) ?? { label, hours: 0 }
    week.hours += shiftHours(shift)
    weeks.set(key, week)
  }
  if (weeks.size === 0) return null

  return (
    <div className="weeks">
      {[...weeks.entries()]
        .sort(([a], [b]) => a - b)
        .map(([key, { label, hours }]) => {
          const level = hours >= MAX_WEEKLY_HOURS ? 'full' : hours >= 32 ? 'high' : 'ok'
          return (
            <div key={key} className="card week">
              <div className="week-top">
                <span className="muted small">{label}</span>
                <strong>
                  {hours}h <span className="muted">/ {MAX_WEEKLY_HOURS}h</span>
                </strong>
              </div>
              <div className="meter">
                <div className={`meter-fill ${level}`} style={{ width: `${Math.min(hours / MAX_WEEKLY_HOURS, 1) * 100}%` }} />
              </div>
              <span className="muted small">{Math.max(MAX_WEEKLY_HOURS - hours, 0)}h left to take on</span>
            </div>
          )
        })}
    </div>
  )
}
