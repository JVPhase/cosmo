import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { getAccessToken } from '@/lib/api'
import AccountsPage from '@/pages/Accounts'
import ActivityPage from '@/pages/Activity'
import DealsPage from '@/pages/Deals'
import LeadsPage from '@/pages/Leads'
import LoginPage from '@/pages/Login'
import GameConfigPage from '@/pages/GameConfig'
import OverviewPage from '@/pages/Overview'
import PlayerGamePage from '@/pages/PlayerGame'

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!getAccessToken()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="game-config" element={<GameConfigPage />} />
        <Route path="game-config/:key" element={<GameConfigPage />} />
        <Route path="players" element={<PlayerGamePage />} />
        <Route path="players/:userId" element={<PlayerGamePage />} />
      </Route>
    </Routes>
  )
}
