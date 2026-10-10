import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Role } from '../api/types'
import { useActor } from '../actor/ActorContext'
import { homeFor } from '../actor/roles'

// Sends the wrong role to their own home page instead of showing a dead end.
// This also covers switching person in "Acting as" while on a page the new
// role cannot use. The backend still enforces roles with 403; this is only UX.
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { actor } = useActor()
  if (actor && actor.role !== role) return <Navigate to={homeFor(actor.role)} replace />
  return children
}
