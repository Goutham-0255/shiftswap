import type { Role } from '../api/types'

// The page each role lands on: staff work from their shifts, managers from the approval queue.
export function homeFor(role: Role) {
  return role === 'MANAGER' ? '/approvals' : '/shifts'
}
