import { useNavigate } from 'react-router'
import type { Staff } from '../api/types'
import { useActor } from '../actor/ActorContext'
import { homeFor } from '../actor/roles'
import { Avatar } from './Avatar'

// Shown until someone is chosen: one click on a person starts the demo as them.
export function WelcomeScreen() {
  const { staff, setActorId } = useActor()
  const navigate = useNavigate()

  const choose = (person: Staff) => {
    setActorId(person.id)
    navigate(homeFor(person.role))
  }

  const group = (title: string, people: Staff[]) => (
    <>
      <h2>{title}</h2>
      <div className="people">
        {people.map((person) => (
          <button key={person.id} className="person" onClick={() => choose(person)}>
            <Avatar name={person.name} role={person.role} />
            <span className="person-text">
              <strong>{person.name}</strong>
              <span className="muted">
                {person.id}
                {person.role === 'STAFF' &&
                  ` · ${person.certifications.length ? person.certifications.join(', ') : 'no certifications'}`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  )

  return (
    <div className="welcome">
      <h1>Who are you today?</h1>
      <p className="muted">
        There is no login: pick a person to act as. You can switch any time from the top right.
      </p>
      {group('Staff', staff.filter((p) => p.role === 'STAFF'))}
      {group('Managers', staff.filter((p) => p.role === 'MANAGER'))}
    </div>
  )
}
