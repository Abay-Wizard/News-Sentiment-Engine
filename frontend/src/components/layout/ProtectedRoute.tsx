import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Activity } from 'lucide-react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--bg)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--green-dim)',
        border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity size={22} color="var(--green)" />
      </div>
      <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>Loading…</span>
    </div>
  )

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
