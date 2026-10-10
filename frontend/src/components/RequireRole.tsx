import type { ReactNode } from 'react'
import type { Role } from '../api/types'
import { useActor } from '../actor/ActorContext'

// Hides a page from the wrong role. The backend enforces the same rule (403),
// this only avoids showing buttons that would always fail.
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { actor } = useActor()
  if (actor?.role !== role) {
    const who = role === 'MANAGER' ? 'managers' : 'staff'
    return <p className="empty">This page is for {who}. Switch person in "Acting as".</p>
  }
  return children
}
