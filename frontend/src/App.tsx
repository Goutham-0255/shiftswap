import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useActor } from './actor/ActorContext'
import { ActorProvider } from './actor/ActorProvider'
import { homeFor } from './actor/roles'
import { Layout } from './components/Layout'
import { RequireRole } from './components/RequireRole'
import { ApprovalsPage } from './pages/ApprovalsPage'
import { HistoryPage } from './pages/HistoryPage'
import { TeamPage } from './pages/TeamPage'
import { MyShiftsPage } from './pages/MyShiftsPage'
import { OpenListingsPage } from './pages/OpenListingsPage'

// "/" sends staff to their shifts and managers to the approvals queue.
function Home() {
  const { actor } = useActor()
  return <Navigate to={actor ? homeFor(actor.role) : '/shifts'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <ActorProvider>
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
      </ActorProvider>
    </BrowserRouter>
  )
}

export default App
