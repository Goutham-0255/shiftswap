import { createContext, useContext } from 'react'
import type { Staff } from '../api/types'

// "Who am I acting as" is needed by the header and by every page, so it
// lives in a context instead of being passed down through props.
export interface ActorContextValue {
  staff: Staff[]
  actor: Staff | null
  setActorId: (id: string | null) => void
  loading: boolean
  error: string | null
}

export const ActorContext = createContext<ActorContextValue | null>(null)

export function useActor() {
  const value = useContext(ActorContext)
  if (!value) throw new Error('useActor must be used inside <ActorProvider>')
  return value
}
