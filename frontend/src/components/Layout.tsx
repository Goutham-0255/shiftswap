import { NavLink, Outlet } from 'react-router'
import { useActor } from '../actor/ActorContext'
import { ActorPicker } from './ActorPicker'

// Header + navigation around every page. Staff and managers see different
// links, because they do different jobs.
export function Layout() {
  const { actor, loading, error } = useActor()

  return (
    <div className="app">
      <header className="header">
        <span className="brand">ShiftSwap</span>
        {actor && (
          <nav className="nav">
            {actor.role === 'STAFF' ? (
              <>
                <NavLink to="/shifts">My shifts</NavLink>
                <NavLink to="/listings">Open listings</NavLink>
              </>
            ) : (
              <NavLink to="/approvals">Approvals</NavLink>
            )}
            <NavLink to="/history">History</NavLink>
          </nav>
        )}
        <ActorPicker />
      </header>

      {/* key: switching person remounts the page, so it reloads its data */}
      <main className="main" key={actor?.id ?? 'nobody'}>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : actor ? (
          <Outlet />
        ) : (
          <div className="empty">
            <h2>Who are you?</h2>
            <p>Choose a person in "Acting as" at the top right to start.</p>
          </div>
        )}
      </main>
    </div>
  )
}
