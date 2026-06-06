import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Radio, Star, Activity, LogOut, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle } from '../ui'

const NAV = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trends',   label: 'Trends',    icon: TrendingUp },
  { to: '/sources',  label: 'Sources',   icon: Radio },
  { to: '/watchlist',label: 'Watchlist', icon: Star },
]

export function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const initials = user
    ? (user.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
       ?? user.username.slice(0, 2).toUpperCase())
    : '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-dim)',
          border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={16} color="var(--green)" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.02em', color: 'var(--fg)' }}>NSE</div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>Sentiment Engine</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="label" style={{ padding: '6px 4px 8px' }}>Navigation</div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={onClose}>
            <Icon size={15} />{label}
          </NavLink>
        ))}
      </nav>

      {/* Theme */}
      <div style={{ padding: '0 10px 8px' }}>
        <ThemeToggle />
      </div>

      {/* User */}
      {user && (
        <div style={{ padding: '8px 10px 14px', borderTop: '1px solid var(--border)', position: 'relative' }}>
          {open && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 10, right: 10,
              background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r)',
              overflow: 'hidden', boxShadow: 'var(--sh-lg)', zIndex: 50 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{user.full_name || user.username}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>{user.email}</div>
              </div>
              <button onClick={() => { logout(); setOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', background: 'none', border: 'none',
                  color: 'var(--red)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-dim)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
          <button onClick={() => setOpen(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 8px', borderRadius: 'var(--r)', border: '1px solid var(--border)',
              background: 'none', cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--elevated)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--green-dim)',
              border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name || user.username}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>
                @{user.username}
              </div>
            </div>
            <ChevronUp size={13} style={{ color: 'var(--fg-3)', flexShrink: 0,
              transform: open ? 'none' : 'rotate(180deg)', transition: 'transform .2s' }} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  return <aside className="sidebar"><SidebarContent /></aside>
}
