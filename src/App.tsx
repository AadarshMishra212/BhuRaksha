import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AiPage } from './pages/AiPage'
import { AlertsPage } from './pages/AlertsPage'
import { CommandCenterPage } from './pages/CommandCenterPage'
import { CommunitiesPage } from './pages/CommunitiesPage'
import { FieldPage } from './pages/FieldPage'
import { GisPage } from './pages/GisPage'
import { LoginPage } from './pages/LoginPage'
import { ResponsePage } from './pages/ResponsePage'
import { SensorsPage } from './pages/SensorsPage'
import { WeatherPage } from './pages/WeatherPage'
import { AppStoreProvider, useStore } from './store/AppStore'
import type { ReactNode } from 'react'

function Guard({ children }: { children: ReactNode }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Guard>
            <AppLayout />
          </Guard>
        }
      >
        <Route path="/" element={<CommandCenterPage />} />
        <Route path="/gis" element={<GisPage />} />
        <Route path="/ai" element={<AiPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/sensors" element={<SensorsPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/field" element={<FieldPage />} />
        <Route path="/response" element={<ResponsePage />} />
        <Route path="/communities" element={<CommunitiesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppStoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppStoreProvider>
  )
}
