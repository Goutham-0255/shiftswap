import { useActor } from '../actor/ActorContext'
import { Avatar } from './Avatar'

// There is no login in this app: you pick who you are acting as.
export function ActorPicker() {
  const { staff, actor, setActorId } = useActor()

  return (
    <label className="actor-picker">
      {actor ? <Avatar name={actor.name} role={actor.role} /> : <span className="muted">Acting as</span>}
      <select
        aria-label="Acting as"
        value={actor?.id ?? ''}
        onChange={(e) => setActorId(e.target.value || null)}
      >
        <option value="">Choose a person</option>
        <optgroup label="Staff">
          {staff.filter((p) => p.role === 'STAFF').map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.id})
            </option>
          ))}
        </optgroup>
        <optgroup label="Managers">
          {staff.filter((p) => p.role === 'MANAGER').map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.id}, manager)
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  )
}
