import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getMe, isAuthenticated, logout, type Me } from './api'
import { AppShell } from './components/AppShell'
import { AuthForm } from './components/AuthForm'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { GarminAccount } from './pages/GarminAccount'
import { Activities } from './pages/Activities'
import { Gear } from './pages/Gear'
import { ActivityDetail } from './pages/ActivityDetail'
import { GearDetail } from './pages/GearDetail'
import { Rewind } from './pages/Rewind'

function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMe = () => {
    if (!isAuthenticated()) {
      setMe(null)
      setLoading(false)
      return
    }
    getMe()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false))
  }

  useEffect(loadMe, [])

  if (loading) return null

  if (!me) {
    return <AuthForm onAuthenticated={loadMe} />
  }

  const handleLogout = () => {
    logout()
    setMe(null)
  }

  return (
    <Routes>
      <Route element={<AppShell me={me} onLogout={handleLogout} />}>
        <Route index element={<Dashboard me={me} />} />
        <Route path="activities" element={<Activities />} />
        <Route path="activities/:id" element={<ActivityDetail />} />
        <Route path="gear" element={<Gear />} />
        <Route path="gear/:id" element={<GearDetail />} />
        <Route path="rewind" element={<Rewind />} />
        <Route path="garmin-account" element={<GarminAccount />} />
        <Route path="settings" element={<Settings me={me} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
