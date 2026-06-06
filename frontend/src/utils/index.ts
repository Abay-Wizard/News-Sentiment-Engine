import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const sentimentColor = (l?: string | null) =>
  l === 'positive' ? 'var(--green)' : l === 'negative' ? 'var(--red)' : 'var(--muted)'

export const sentimentBg = (l?: string | null) =>
  l === 'positive' ? 'var(--green-dim)' : l === 'negative' ? 'var(--red-dim)' : 'var(--muted-dim)'

export const sentimentBorder = (l?: string | null) =>
  l === 'positive' ? 'var(--green-border)' : l === 'negative' ? 'var(--red-border)' : 'var(--border)'

export const sourceName = (s: string) =>
  ({ reuters: 'Reuters', cnbc: 'CNBC', yahoo_finance: 'Yahoo Finance' }[s] ?? s)

export const sourceColor = (s: string) =>
  ({ reuters: '#e6522c', cnbc: '#1e6fdd', yahoo_finance: '#6001d2' }[s] ?? '#8b949e')

export const sourceAccent = (s: string) =>
  ({ reuters: 'rgba(230,82,44,0.12)', cnbc: 'rgba(30,111,221,0.12)', yahoo_finance: 'rgba(96,1,210,0.12)' }[s] ?? 'rgba(139,148,158,0.1)')

export const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'MMM d, HH:mm') } catch { return iso }
}

export const timeAgo = (iso?: string | null) => {
  if (!iso) return '—'
  try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }) } catch { return iso }
}

export const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}k`
  : String(n)

export const pct = (v: number, t: number) => t ? Math.round(v / t * 1000) / 10 : 0
