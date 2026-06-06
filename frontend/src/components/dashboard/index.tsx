import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { ReactNode } from 'react'
import type { SentimentSummary, EntitySentiment } from '../../types'
import { Skel, Badge } from '../ui'

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color = 'var(--blue)', loading }: {
  label: string; value: string | number; sub?: string;
  icon: ReactNode; color?: string; loading?: boolean
}) {
  if (loading) return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skel h={12} w="50%" /><Skel h={30} w="70%" /><Skel h={11} w="40%" />
    </div>
  )
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="label">{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`,
          border: `1px solid ${color}30`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div className="stat-n" style={{ color: 'var(--fg)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{sub}</div>}
    </div>
  )
}

// ── SentimentGauge ────────────────────────────────────────────────────────────
export function SentimentGauge({ data, loading }: { data?: SentimentSummary; loading?: boolean }) {
  if (loading || !data) return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skel h={12} w="55%" /><Skel h={26} w="70%" /><Skel h={5} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Skel h={64} /><Skel h={64} /><Skel h={64} />
      </div>
    </div>
  )

  const mood = data.bullish_pct > 60 ? 'STRONGLY BULLISH'
    : data.bearish_pct > 60 ? 'STRONGLY BEARISH'
    : data.bullish_pct > data.bearish_pct ? 'CAUTIOUSLY BULLISH'
    : data.bearish_pct > data.bullish_pct ? 'CAUTIOUSLY BEARISH'
    : 'NEUTRAL'

  const moodColor = data.bullish_pct >= data.bearish_pct ? 'var(--green)' : 'var(--red)'

  const momentum = data.momentum === 'up'
    ? { icon: '↑', color: 'var(--green)', label: `+${data.momentum_delta}% vs prev 6h` }
    : data.momentum === 'down'
    ? { icon: '↓', color: 'var(--red)',   label: `-${data.momentum_delta}% vs prev 6h` }
    : { icon: '→', color: 'var(--muted)', label: 'Stable vs prev 6h' }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Market Sentiment · 7d</div>
          <div style={{ fontSize: 'clamp(0.95rem,3vw,1.3rem)', fontWeight: 800, color: moodColor, letterSpacing: '-.02em' }}>
            {mood}
          </div>
          <div style={{ fontSize: 11, color: momentum.color, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{momentum.icon}</span>
            <span style={{ fontFamily: 'var(--mono)' }}>{momentum.label}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="label" style={{ marginBottom: 2 }}>Articles</div>
          <div className="stat-n-sm" style={{ fontFamily: 'var(--mono)', color: 'var(--fg)' }}>{data.total}</div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="sent-bar">
        <div style={{ flex: data.bullish_pct, background: 'var(--green)', borderRadius: '2px 0 0 2px', minWidth: data.bullish_pct > 0 ? 3 : 0 }} />
        <div style={{ flex: data.neutral_pct, background: 'var(--muted)', minWidth: data.neutral_pct > 0 ? 3 : 0 }} />
        <div style={{ flex: data.bearish_pct, background: 'var(--red)', borderRadius: '0 2px 2px 0', minWidth: data.bearish_pct > 0 ? 3 : 0 }} />
      </div>

      {/* Pct pills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { l: 'Bullish', p: data.bullish_pct, c: data.positive, color: 'var(--green)', bg: 'var(--green-dim)', border: 'var(--green-border)' },
          { l: 'Neutral', p: data.neutral_pct, c: data.neutral,  color: 'var(--muted)', bg: 'var(--muted-dim)', border: 'var(--border)' },
          { l: 'Bearish', p: data.bearish_pct, c: data.negative, color: 'var(--red)',   bg: 'var(--red-dim)',   border: 'var(--red-border)' },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 'var(--r)', padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1rem,4vw,1.25rem)', fontWeight: 700, color: s.color, fontFamily: 'var(--mono)', lineHeight: 1 }}>
              {s.p.toFixed(1)}%
            </div>
            <div style={{ fontSize: 10, color: s.color, marginTop: 3, fontFamily: 'var(--mono)' }}>{s.l}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{s.c}</div>
          </div>
        ))}
      </div>

      {data.avg_score != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px',
          background: 'var(--elevated)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
          <span className="label">Avg Confidence</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>
            {((data.avg_score) * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

// ── MarketMood (donut) ────────────────────────────────────────────────────────
const PieTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)', padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 12 }}>
      {payload[0].name}: <strong>{payload[0].value}%</strong>
    </div>
  )
}

export function MarketMood({ data, loading }: { data?: SentimentSummary; loading?: boolean }) {
  if (loading || !data) return <div className="card"><Skel h={200} /></div>

  const chartData = [
    { name: 'Bullish', value: data.bullish_pct, color: 'var(--green)' },
    { name: 'Neutral', value: data.neutral_pct, color: '#484f58' },
    { name: 'Bearish', value: data.bearish_pct, color: 'var(--red)' },
  ]
  const dominant  = data.bullish_pct > data.bearish_pct ? 'BULL' : 'BEAR'
  const domColor  = dominant === 'BULL' ? 'var(--green)' : 'var(--red)'
  const domPct    = dominant === 'BULL' ? data.bullish_pct : data.bearish_pct

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="label">Bull / Bear Signal</div>
      <div style={{ position: 'relative', height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%"
              startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
              {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip content={<PieTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--mono)', letterSpacing: '.1em' }}>MARKET</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: domColor, fontFamily: 'var(--mono)', lineHeight: 1.1 }}>{dominant}</div>
          <div style={{ fontSize: 12, color: domColor, fontFamily: 'var(--mono)' }}>{domPct.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {chartData.map(d => (
          <div key={d.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color }} />
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>{d.name}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: d.color, fontFamily: 'var(--mono)' }}>{d.value.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TopEntities ───────────────────────────────────────────────────────────────
export function TopEntities({ data, loading }: { data?: EntitySentiment[]; loading?: boolean }) {
  if (loading || !data) return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skel h={12} w="55%" />
      {[0, 1, 2, 3, 4].map(i => <Skel key={i} h={44} />)}
    </div>
  )

  const max = Math.max(...data.map(e => Number(e.total_mentions)), 1)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="label">Top Mentioned · 48h</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.slice(0, 8).map(e => {
          const total = Number(e.positive_count) + Number(e.negative_count) + Number(e.neutral_count)
          const posPct = total ? Number(e.positive_count) / total * 100 : 0
          const negPct = total ? Number(e.negative_count) / total * 100 : 0
          const barW   = Number(e.total_mentions) / max * 100

          return (
            <div key={e.entity_name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {e.ticker && <Badge variant="blu">{e.ticker}</Badge>}
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.entity_name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                    {posPct.toFixed(0)}%↑
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>
                    {e.total_mentions}
                  </span>
                </div>
              </div>
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2,
                overflow: 'hidden', width: `${barW}%` }}>
                <div style={{ display: 'flex', height: '100%' }}>
                  <div style={{ flex: posPct, background: 'var(--green)' }} />
                  <div style={{ flex: 100 - posPct - negPct, background: 'var(--muted)' }} />
                  <div style={{ flex: negPct, background: 'var(--red)' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
