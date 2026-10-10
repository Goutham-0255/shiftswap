import type { Violation } from '../api/types'

// Every broken rule, e.g. "Rule 3: Overlaps your shift SH12 (...)".
export function ReasonList({ reasons }: { reasons: Violation[] }) {
  if (reasons.length === 0) return null
  return (
    <ul className="reasons">
      {reasons.map((reason, i) => (
        <li key={i}>
          {reason.rule !== undefined && <strong>Rule {reason.rule}: </strong>}
          {reason.message}
        </li>
      ))}
    </ul>
  )
}
