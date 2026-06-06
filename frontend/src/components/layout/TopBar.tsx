import { useState } from 'react'
import { Menu, X, Activity } from 'lucide-react'
import { SidebarContent } from './Sidebar'
import { ThemeToggle } from '../ui'

const TICKERS = [
  { s:'SPY', p:'527.43', c:'+1.2%', up:true }, { s:'QQQ', p:'453.18', c:'+1.9%', up:true },
  { s:'AAPL',p:'196.45', c:'+0.5%', up:true }, { s:'NVDA',p:'947.63', c:'+3.4%', up:true },
  { s:'TSLA',p:'175.30', c:'-4.2%', up:false}, { s:'MSFT',p:'421.82', c:'+2.1%', up:true },
  { s:'META',p:'528.70', c:'-0.9%', up:false}, { s:'GOOGL',p:'178.90',c:'-2.3%', up:false},
  { s:'AMZN',p:'192.15', c:'+0.8%', up:true }, { s:'JPM', p:'205.40', c:'+0.3%', up:true },
  { s:'BTC', p:'74,850', c:'+5.1%', up:true }, { s:'VIX', p:'14.82',  c:'-3.1%', up:false},
  { s:'GLD', p:'225.70', c:'+0.4%', up:true }, { s:'DJI', p:'39,142', c:'+0.6%', up:true },
]
const doubled = [...TICKERS, ...TICKERS]

export default function TopBar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile topbar */}
      <header className="mob-topbar">
        <button className="btn-icon" onClick={() => setOpen(true)}><Menu size={18} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <Activity size={16} color="var(--green)" />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.02em', color: 'var(--fg)' }}>NSE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle compact />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--green)' }}>LIVE</span>
          </div>
        </div>
      </header>

      {/* Desktop ticker bar */}
      <div className="topbar hide-mob"
        style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 16px', borderRight: '1px solid var(--border)', flexShrink: 0, height: '100%' }}>
          <div className="live-dot" />
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--green)', letterSpacing: '.1em' }}>LIVE</span>
        </div>
        <div className="ticker-wrap" style={{ flex: 1 }}>
          <div className="ticker-track">
            {doubled.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 18px', flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 11 }}>
                <span style={{ color: 'var(--fg-3)' }}>{t.s}</span>
                <span style={{ color: 'var(--fg)' }}>{t.p}</span>
                <span style={{ color: t.up ? 'var(--green)' : 'var(--red)' }}>{t.c}</span>
                <span style={{ color: 'var(--border)' }}>│</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="drawer-bg" onClick={() => setOpen(false)} />
          <div className="drawer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--fg)' }}>Menu</span>
              <button className="btn-icon" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <SidebarContent onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}
