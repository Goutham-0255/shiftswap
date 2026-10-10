import type { ActionError } from '../hooks/useAction'
import { ReasonList } from './ReasonList'

// The result of the last button click: a green notice or a red error with reasons.
export function ActionFeedback({ notice, error }: { notice: string | null; error: ActionError | null }) {
  if (error) {
    return (
      <div className="error" role="alert">
        {error.message}
        <ReasonList reasons={error.reasons} />
      </div>
    )
  }
  if (notice) return <div className="notice" role="status">{notice}</div>
  return null
}
