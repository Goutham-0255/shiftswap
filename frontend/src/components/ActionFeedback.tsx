import type { ActionError } from '../hooks/useAction'
import { ReasonList } from './ReasonList'

// The result of the last button click: a green notice or a red error with reasons.
export function ActionFeedback({
  notice,
  error,
  onDismiss,
}: {
  notice: string | null
  error: ActionError | null
  onDismiss: () => void
}) {
  if (!error && !notice) return null
  return (
    <div className={`banner ${error ? 'error' : 'notice'}`} role={error ? 'alert' : 'status'}>
      <div>
        {error ? error.message : notice}
        {error && <ReasonList reasons={error.reasons} />}
      </div>
      <button className="dismiss" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
