import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { TrendPoint, SourceStat } from '../../types'
import { Skel } from '../ui'
import { sourceName } from '../../utils'

const TIP_STYLE = {
  background: 'var(--elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', fontFamily: 'var(--mono)', fontSize: 12,
}

// ── Sentiment Trend ───────────────────────────────────────────────────────────
export function TrendChart({ data, loading, hours = 24, height = 230 }: {
  data?: TrendPoint[]; loading?: boolean; hours?: number; height?: number
}) {
  if (loading || !data) return (
    <div className="card">
      <div className="label" style={{ marginBottom: 12 }}>Sentiment Trend</div>
      <Skel h={height} />
    </div>
  )

  const fmt = (h: string) => {
    try { return format(parseISO(h), hours <= 24 ? 'HH:mm' : 'MMM d HH:mm') }
    catch { return h }
  }

  const formatted = data.map(d => ({ ...d, label: fmt(d.hour) }))

  return (
    <div className="card">
      <div className="label" style={{ marginBottom: 14 }}>Sentiment Trend · {hours}h</div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            {[['p','#3fb950'],['n','#f85149'],['u','#8b949e']].map(([id, c]) => (
              <linearGradient key={id} id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                <stop offset="95%" stopColor={c} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill:'var(--fg-3)', fontSize:10, fontFamily:'var(--mono)' }}
            axisLine={{ stroke:'var(--border)' }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill:'var(--fg-3)', fontSize:10, fontFamily:'var(--mono)' }}
            axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TIP_STYLE} labelStyle={{ color:'var(--fg-3)', marginBottom:4 }}
            itemStyle={{ textTransform:'capitalize' }} />
          <Legend wrapperStyle={{ fontSize:11, fontFamily:'var(--mono)', paddingTop:10 }} />
          <Area type="monotone" dataKey="positive" stroke="#3fb950" strokeWidth={2}
            fill="url(#gp)" dot={false} name="positive" />
          <Area type="monotone" dataKey="neutral"  stroke="#8b949e" strokeWidth={1.5}
            fill="url(#gu)" dot={false} name="neutral" />
          <Area type="monotone" dataKey="negative" stroke="#f85149" strokeWidth={2}
            fill="url(#gn)" dot={false} name="negative" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Confidence score line ─────────────────────────────────────────────────────
export function ConfidenceChart({ data, loading, hours = 24, height = 140 }: {
  data?: TrendPoint[]; loading?: boolean; hours?: number; height?: number
}) {
  if (loading || !data || data.length === 0) return null
  const fmt = (h: string) => {
    try { return format(parseISO(h), hours <= 24 ? 'HH:mm' : 'MMM d') } catch { return h }
  }
  const formatted = data.map(d => ({
    label: fmt(d.hour),
    conf: d.avg_score ? Math.round(d.avg_score * 100) : 0,
  }))

  return (
    <div className="card">
      <div className="label" style={{ marginBottom: 14 }}>Avg Confidence Score %</div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill:'var(--fg-3)', fontSize:10, fontFamily:'var(--mono)' }}
            axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill:'var(--fg-3)', fontSize:10, fontFamily:'var(--mono)' }}
            axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip contentStyle={TIP_STYLE} labelStyle={{ color:'var(--fg-3)' }}
            itemStyle={{ color:'var(--amber)' }} />
          <Line type="monotone" dataKey="conf" stroke="var(--amber)"
            strokeWidth={2} dot={false} name="Confidence %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Source Comparison ─────────────────────────────────────────────────────────
export function SourceChart({ data, loading, height = 220 }: {
  data?: SourceStat[]; loading?: boolean; height?: number
}) {
  if (loading || !data) return (
    <div className="card">
      <div className="label" style={{ marginBottom: 12 }}>Source Comparison</div>
      <Skel h={height} />
    </div>
  )

  const formatted = data.map(d => ({
    name: sourceName(d.source),
    Positive: d.positive,
    Neutral: d.neutral,
    Negative: d.negative,
  }))

  return (
    <div className="card">
      <div className="label" style={{ marginBottom: 14 }}>Source Comparison · 48h</div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={3}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="name" tick={{ fill:'var(--fg-3)', fontSize:11, fontFamily:'var(--mono)' }}
            axisLine={{ stroke:'var(--border)' }} tickLine={false} />
          <YAxis tick={{ fill:'var(--fg-3)', fontSize:10, fontFamily:'var(--mono)' }}
            axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TIP_STYLE} cursor={{ fill:'rgba(255,255,255,.03)' }} />
          <Legend wrapperStyle={{ fontSize:11, fontFamily:'var(--mono)', paddingTop:10 }} />
          <Bar dataKey="Positive" fill="#3fb950" radius={[3,3,0,0]} maxBarSize={36} />
          <Bar dataKey="Neutral"  fill="#484f58" radius={[3,3,0,0]} maxBarSize={36} />
          <Bar dataKey="Negative" fill="#f85149" radius={[3,3,0,0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
