import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useActor } from './actor/ActorContext'
import { ActorProvider } from './actor/ActorProvider'
import { Layout } from './components/Layout'
import { MyShiftsPage } from './pages/MyShiftsPage'
import { OpenListingsPage } from './pages/OpenListingsPage'

// "/" sends staff to their shifts and managers to the approvals queue.
function Home() {
  const { actor } = useActor()
  return <Navigate to={actor?.role === 'MANAGER' ? '/approvals' : '/shifts'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <ActorProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shifts" element={<MyShiftsPage />} />
            <Route path="listings" element={<OpenListingsPage />} />
            <Route path="approvals" element={<p className="muted">Approvals: next step</p>} />
            <Route path="history" element={<p className="muted">History: next step</p>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ActorProvider>
    </BrowserRouter>
  )
}

export default App
