import { useActor } from '../actor/ActorContext'

// There is no login in this app: you pick who you are acting as.
export function ActorPicker() {
  const { staff, actor, setActorId } = useActor()

  return (
    <label className="actor-picker">
      Acting as
      <select value={actor?.id ?? ''} onChange={(e) => setActorId(e.target.value || null)}>
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
              {p.name} ({p.id})
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  )
}
