import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useActor } from './actor/ActorContext'
import { ActorProvider } from './actor/ActorProvider'
import { homeFor } from './actor/roles'
import { Layout } from './components/Layout'
import { RequireRole } from './components/RequireRole'

// Each page is downloaded only when its route is first visited (smaller first load).
const MyShiftsPage = lazy(() => import('./pages/MyShiftsPage').then((m) => ({ default: m.MyShiftsPage })))
const OpenListingsPage = lazy(() =>
  import('./pages/OpenListingsPage').then((m) => ({ default: m.OpenListingsPage })),
)
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })))
const TeamPage = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))

// "/" sends staff to their shifts and managers to the approvals queue.
function Home() {
  const { actor } = useActor()
  return <Navigate to={actor ? homeFor(actor.role) : '/shifts'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <ActorProvider>
        <Suspense fallback={<p className="muted">Loading…</p>}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route
              path="shifts"
              element={
                <RequireRole role="STAFF">
                  <MyShiftsPage />
                </RequireRole>
              }
            />
            <Route
              path="listings"
              element={
                <RequireRole role="STAFF">
                  <OpenListingsPage />
                </RequireRole>
              }
            />
            <Route
              path="approvals"
              element={
                <RequireRole role="MANAGER">
                  <ApprovalsPage />
                </RequireRole>
              }
            />
            <Route
              path="team"
              element={
                <RequireRole role="MANAGER">
                  <TeamPage />
                </RequireRole>
              }
            />
            <Route path="history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </Suspense>
      </ActorProvider>
    </BrowserRouter>
  )
}

export default App
