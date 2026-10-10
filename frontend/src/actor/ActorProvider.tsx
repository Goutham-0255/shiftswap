import { useState, type ReactNode } from 'react'
import { api, getActorId, saveActorId } from '../api/client'
import { useApi } from '../hooks/useApi'
import { ActorContext } from './ActorContext'

export function ActorProvider({ children }: { children: ReactNode }) {
  const { data: staff, loading, error, reload } = useApi(api.staff)
  const [actorId, setActorIdState] = useState(getActorId)

  const setActorId = (id: string | null) => {
    saveActorId(id) // saved first, so the next request already sends the new header
    setActorIdState(id)
  }

  const list = staff ?? []
  const actor = list.find((person) => person.id === actorId) ?? null

  return (
    <ActorContext.Provider value={{ staff: list, actor, setActorId, loading: loading && !staff, error, reloadStaff: reload }}>
      {children}
    </ActorContext.Provider>
  )
}
