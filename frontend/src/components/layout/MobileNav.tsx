import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Radio, Star, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trends',    label: 'Trends',    icon: TrendingUp },
  { to: '/sources',   label: 'Sources',   icon: Radio },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
]

export default function MobileNav() {
  const { logout } = useAuth()
  return (
    <nav className="bot-nav">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'}
          style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, textDecoration: 'none', padding: '8px 4px' }}
          children={({ isActive }) => (
            <>
              <Icon size={20} color={isActive ? 'var(--green)' : 'var(--fg-3)'} />
              <span style={{ fontSize: 9, fontWeight: 500, fontFamily: 'var(--mono)',
                color: isActive ? 'var(--green)' : 'var(--fg-3)' }}>{label}</span>
            </>
          )}
        />
      ))}
      <button onClick={logout}
        style={{ flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 3, padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <LogOut size={20} color="var(--red)" />
        <span style={{ fontSize: 9, fontWeight: 500, fontFamily: 'var(--mono)', color: 'var(--red)' }}>
          Sign out
        </span>
      </button>
    </nav>
  )
}
