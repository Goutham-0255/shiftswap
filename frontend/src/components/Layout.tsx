import { Link, NavLink, Outlet } from 'react-router'
import { useActor } from '../actor/ActorContext'
import { ActorPicker } from './ActorPicker'
import { WelcomeScreen } from './WelcomeScreen'

// Header + navigation around every page. Staff and managers see different
// links, because they do different jobs.
export function Layout() {
  const { actor, loading, error } = useActor()

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="logo" aria-hidden="true">
              ⇄
            </span>
            ShiftSwap
          </Link>
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
        </div>
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
          <WelcomeScreen />
        )}
      </main>
    </div>
  )
}
