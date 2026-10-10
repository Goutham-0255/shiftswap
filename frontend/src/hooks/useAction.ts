import { useState } from 'react'
import { ApiError } from '../api/client'
import type { Violation } from '../api/types'

export interface ActionError {
  message: string
  reasons: Violation[]
}

// Pulls the rule violations out of an error response (422 sends a list).
function toActionError(err: unknown): ActionError {
  if (!(err instanceof Error)) return { message: 'Something went wrong', reasons: [] }
  const details = err instanceof ApiError && Array.isArray(err.details) ? err.details : []
  const reasons = details.filter((d): d is Violation => typeof d?.message === 'string')
  return { message: err.message, reasons }
}

// Runs a button's request: disables buttons while busy, shows a success
// notice or the error with every reason, then reloads the page's data.
export function useAction(reload: () => void) {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<ActionError | null>(null)

  async function run(request: () => Promise<unknown>, successMessage: string) {
    setBusy(true)
    setNotice(null)
    setError(null)
    try {
      await request()
      setNotice(successMessage)
      reload()
    } catch (err) {
      setError(toActionError(err))
      // 409 means our data is stale (someone else acted first): refresh it.
      if (err instanceof ApiError && err.status === 409) reload()
    } finally {
      setBusy(false)
    }
  }

  function clear() {
    setNotice(null)
    setError(null)
  }

  return { run, busy, notice, error, clear }
}
