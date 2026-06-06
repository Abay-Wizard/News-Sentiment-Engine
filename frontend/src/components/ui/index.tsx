import type { ReactNode, CSSProperties } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skel({ h = 20, w = '100%', r = 'var(--r)' }:
  { h?: number; w?: string | number; r?: string }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r }} />
}

export function CardSkel({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skel h={13} w="55%" />
      {Array.from({ length: rows }).map((_, i) =>
        <Skel key={i} h={14} w={i === rows - 1 ? '70%' : '100%'} />)}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'pos' | 'neg' | 'neu' | 'blu' | 'default'

export function Badge({ children, variant = 'default', icon }:
  { children: ReactNode; variant?: BadgeVariant; icon?: ReactNode }) {
  return (
    <span className={`badge badge-${variant}`}>
      {icon}{children}
    </span>
  )
}

export function SentimentBadge({ label, score }:
  { label: string | null; score?: number | null }) {
  if (!label) return null
  const v = label === 'positive' ? 'pos' : label === 'negative' ? 'neg' : 'neu'
  return (
    <Badge variant={v}>
      {label}{score != null ? ` ${(score * 100).toFixed(0)}%` : ''}
    </Badge>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, className = '' }:
  { children: ReactNode; style?: CSSProperties; className?: string }) {
  return <div className={`card ${className}`} style={style}>{children}</div>
}

export function CardHeader({ label, title, action }:
  { label?: string; title: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
      <div>
        {label && <div className="label" style={{ marginBottom: 4 }}>{label}</div>}
        <h3 style={{ color: 'var(--fg)', fontSize: 15 }}>{title}</h3>
      </div>
      {action}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon, title, desc, action }:
  { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 10, padding: '44px 20px', textAlign: 'center', color: 'var(--fg-3)' }}>
      <div style={{ opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-2)' }}>{title}</div>
      {desc && <div style={{ fontSize: 13, maxWidth: 280 }}>{desc}</div>}
      {action}
    </div>
  )
}

// ── Error box ─────────────────────────────────────────────────────────────────
export function ErrorBox({ message, onRetry }:
  { message: string; onRetry?: () => void }) {
  return (
    <div style={{ padding: '16px', background: 'var(--red-dim)', border: '1px solid var(--red-border)',
      borderRadius: 'var(--r)', color: 'var(--red)', fontSize: 13, display: 'flex',
      alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button className="btn btn-xs btn-danger" onClick={onRetry}>Retry</button>
      )}
    </div>
  )
}

// ── Theme toggle ──────────────────────────────────────────────────────────────
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className={compact ? 'btn-icon' : 'btn btn-ghost btn-sm'}
      style={compact ? {} : { width: '100%', justifyContent: 'flex-start', gap: 10 }}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      {!compact && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  )
}
