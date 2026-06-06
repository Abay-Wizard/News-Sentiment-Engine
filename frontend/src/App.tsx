import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import MobileNav from './components/layout/MobileNav'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Trends from './pages/Trends'
import Sources from './pages/Sources'
import Watchlist from './pages/Watchlist'
import Login from './pages/Login'
import Register from './pages/Register'

function AppShell() {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <TopBar />
        <div className="page">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/trends"    element={<Trends />} />
            <Route path="/sources"   element={<Sources />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()
  const authed = !loading && isAuthenticated

  return (
    <Routes>
      <Route path="/login"    element={authed ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={authed ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
    </Routes>
  )
}
