import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useActor } from '../actor/ActorContext'
import { ActionFeedback } from '../components/ActionFeedback'
import { Avatar } from '../components/Avatar'
import { CertTag } from '../components/CertTag'
import { PageHeader } from '../components/PageHeader'
import { useAction } from '../hooks/useAction'

const CERTIFICATIONS = ['ICU', 'PEDS']

// Managers: everyone on the roster, plus a form to add a new staff member.
// The new person can be picked in "Acting as" at once and can claim open shifts.
export function TeamPage() {
  const { staff, reloadStaff } = useActor()
  const action = useAction(reloadStaff)
  const [name, setName] = useState('')
  const [certs, setCerts] = useState<string[]>([])

  const toggle = (cert: string) =>
    setCerts((current) => (current.includes(cert) ? current.filter((c) => c !== cert) : [...current, cert]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    const added = await action.run(
      () => api.addStaff(trimmed, certs),
      `Added ${trimmed}. They can now be picked in "Acting as".`,
    )
    if (added) {
      setName('')
      setCerts([])
    }
  }

  const people = staff.filter((p) => p.role === 'STAFF')

  return (
    <section>
      <PageHeader title="Team" count={`${people.length} staff`} subtitle="Add a staff member to the roster." />
      <ActionFeedback notice={action.notice} error={action.error} onDismiss={action.clear} />

      <form className="card form" onSubmit={submit}>
        <label className="field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kiran" maxLength={60} />
        </label>
        <fieldset className="field">
          <legend>Certifications</legend>
          {CERTIFICATIONS.map((cert) => (
            <label key={cert} className="check">
              <input type="checkbox" checked={certs.includes(cert)} onChange={() => toggle(cert)} /> {cert}
            </label>
          ))}
        </fieldset>
        <button className="button" disabled={action.busy || !name.trim()}>
          Add staff member
        </button>
      </form>

      <h2>Staff</h2>
      <div className="card">
        <table className="table">
          <tbody>
            {people.map((person) => (
              <tr key={person.id}>
                <td>
                  <span className="person-row">
                    <Avatar name={person.name} role={person.role} />
                    <strong>{person.name}</strong>
                  </span>
                </td>
                <td className="mono">{person.id}</td>
                <td>
                  {person.certifications.length === 0 ? (
                    <span className="muted">No certifications</span>
                  ) : (
                    person.certifications.map((cert) => (
                      <span key={cert}>
                        <CertTag cert={cert} />{' '}
                      </span>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
