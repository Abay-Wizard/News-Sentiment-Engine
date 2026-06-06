import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Q } from '../api/queries'
import { TrendChart, ConfidenceChart } from '../components/charts'
import { Skel, Badge } from '../components/ui'
import type { EntitySentiment } from '../types'

const WINDOWS = [{ l:'6h', h:6 }, { l:'24h', h:24 }, { l:'48h', h:48 }, { l:'7d', h:168 }]

export default function Trends() {
  const [hours, setHours] = useState(24)
  const trend    = useQuery({ queryKey: Q.keys.trend(hours), queryFn: () => Q.trend(hours), staleTime: 60_000 })
  const entities = useQuery({ queryKey: Q.keys.entities, queryFn: () => Q.entities(12), staleTime: 60_000 })

  return (
    <div className="page-inner fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1>Sentiment Trends</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--mono)' }}>
            Hourly breakdown · multi-window analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WINDOWS.map(w => (
            <button key={w.h} onClick={() => setHours(w.h)}
              className={`btn btn-sm ${hours === w.h ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontFamily: 'var(--mono)' }}>
              {w.l}
            </button>
          ))}
        </div>
      </div>

      <TrendChart data={trend.data?.data} loading={trend.isLoading} hours={hours} height={260} />
      <ConfidenceChart data={trend.data?.data} loading={trend.isLoading} hours={hours} />

      {/* Entity heatmap */}
      <div className="card">
        <div className="label" style={{ marginBottom: 14 }}>Entity Sentiment Heatmap · 48h</div>
        {entities.isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={80} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 8 }}>
            {(entities.data ?? []).map(e => <EntityTile key={e.entity_name} e={e} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function EntityTile({ e }: { e: EntitySentiment }) {
  const total = Number(e.positive_count) + Number(e.negative_count) + Number(e.neutral_count)
  const posPct = total ? Number(e.positive_count) / total : 0
  const negPct = total ? Number(e.negative_count) / total : 0
  const dom = posPct > 0.5 ? 'pos' : negPct > 0.5 ? 'neg' : 'neu'
  const intensity = Math.max(posPct, negPct)

  const bg = dom === 'pos'
    ? `rgba(63,185,80,${0.06 + intensity * 0.16})`
    : dom === 'neg'
    ? `rgba(248,81,73,${0.06 + intensity * 0.16})`
    : 'var(--muted-dim)'

  const border = dom === 'pos'
    ? `rgba(63,185,80,${0.15 + intensity * 0.3})`
    : dom === 'neg'
    ? `rgba(248,81,73,${0.15 + intensity * 0.3})`
    : 'var(--border)'

  return (
    <div style={{ background: bg, border: `1px solid ${border}`,
      borderRadius: 'var(--r)', padding: '10px 11px',
      display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.3 }}>
          {e.entity_name}
        </span>
        {e.ticker && <Badge variant="blu">{e.ticker}</Badge>}
      </div>
      <div style={{ display: 'flex', gap: 3, height: 3, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ flex: Number(e.positive_count), background: 'var(--green)' }} />
        <div style={{ flex: Number(e.neutral_count),  background: 'var(--muted)' }} />
        <div style={{ flex: Number(e.negative_count), background: 'var(--red)' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>
        {e.total_mentions} mentions
      </div>
    </div>
  )
}
