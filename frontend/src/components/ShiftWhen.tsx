import type { Shift } from '../api/types'
import { shiftHours, shiftParts } from '../lib/format'

// Day in bold, time and length underneath: easier to scan than one long line.
export function ShiftWhen({ shift }: { shift: Pick<Shift, 'start' | 'end'> }) {
  const { day, time } = shiftParts(shift)
  return (
    <div className="when">
      <strong>{day}</strong>
      <span className="muted">
        {time} · {shiftHours(shift)}h
      </span>
    </div>
  )
}
