import { useCallback, useEffect, useState } from 'react'

// Loads data once on mount and gives the page loading / error / reload,
// so no page has to repeat that boilerplate. `load` must be a stable
// function (e.g. api.myShifts), otherwise it would refetch on every render.
export function useApi<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false // ignore a response that arrives after unmount
    load()
      .then((result) => {
        if (cancelled) return
        setData(result)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load, version])

  const reload = useCallback(() => {
    setLoading(true)
    setVersion((v) => v + 1)
  }, [])

  return { data, error, loading, reload }
}
