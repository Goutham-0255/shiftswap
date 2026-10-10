import type { Role } from '../api/types'

// Initials in a coloured circle; managers get a different colour from staff.
export function Avatar({ name, role }: { name: string; role: Role }) {
  return (
    <span className={`avatar ${role === 'MANAGER' ? 'avatar-manager' : ''}`} aria-hidden="true">
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}
