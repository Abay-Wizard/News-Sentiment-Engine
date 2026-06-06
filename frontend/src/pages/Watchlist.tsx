import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Q } from '../api/queries'
import { Skel, Empty, ErrorBox } from '../components/ui'
import { fmtNum } from '../utils'
import type { WatchlistItem } from '../types'

// Known tickers for quick-add
const QUICK_ADD = [
  { ticker:'AAPL', name:'Apple' }, { ticker:'MSFT', name:'Microsoft' },
  { ticker:'NVDA', name:'Nvidia' }, { ticker:'TSLA', name:'Tesla' },
  { ticker:'GOOGL', name:'Alphabet' }, { ticker:'AMZN', name:'Amazon' },
  { ticker:'META', name:'Meta' }, { ticker:'JPM', name:'JPMorgan' },
  { ticker:'BTC', name:'Bitcoin' }, { ticker:'GS', name:'Goldman Sachs' },
]

export default function Watchlist() {
  const qc = useQueryClient()
  const [customTicker, setCustomTicker] = useState('')
  const [customName,   setCustomName]   = useState('')

  const wl   = useQuery({ queryKey: Q.keys.watchlist,   queryFn: Q.watchlist,   staleTime: 30_000 })
  const sent = useQuery({ queryKey: Q.keys.wlSentiment, queryFn: Q.wlSentiment, staleTime: 30_000 })

  const add = useMutation({
    mutationFn: ({ ticker, name }: { ticker: string; name: string }) =>
      Q.addWatchlist(ticker, name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: Q.keys.watchlist }); qc.invalidateQueries({ queryKey: Q.keys.wlSentiment }) },
  })

  const remove = useMutation({
    mutationFn: Q.removeWatchlist,
    onSuccess: () => { qc.invalidateQueries({ queryKey: Q.keys.watchlist }); qc.invalidateQueries({ queryKey: Q.keys.wlSentiment }) },
  })

  const wlTickers = new Set((wl.data ?? []).map(w => w.ticker))

  function addCustom() {
    if (!customTicker || !customName) return
    add.mutate({ ticker: customTicker.toUpperCase(), name: customName })
    setCustomTicker(''); setCustomName('')
  }

  // Merge watchlist with sentiment data
  const items: (WatchlistItem & { added_at: string })[] = (wl.data ?? []).map(w => {
    const s = (sent.data ?? []).find(s => s.ticker === w.ticker)
    return { ...w, ...(s ?? { mentions:0, positive:0, negative:0, neutral:0, avg_score:null }) }
  })

  return (
    <div className="page-inner fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1>Watchlist</h1>
        <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--mono)' }}>
          Track sentiment for your favourite tickers
        </p>
      </div>

      {/* Quick add buttons */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="label">Quick Add</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_ADD.map(q => {
            const inWl = wlTickers.has(q.ticker)
            return (
              <button key={q.ticker}
                className={`btn btn-xs ${inWl ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ border: '1px solid var(--border)', opacity: inWl ? 0.5 : 1 }}
                disabled={inWl || add.isPending}
                onClick={() => add.mutate({ ticker: q.ticker, name: q.name })}>
                {inWl ? '✓ ' : '+ '}{q.ticker}
              </button>
            )
          })}
        </div>

        {/* Custom add */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8,
          borderTop: '1px solid var(--border)' }}>
          <input value={customTicker} onChange={e => setCustomTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (e.g. NFLX)" style={{ flex:'1 1 100px', minWidth: 90 }} />
          <input value={customName} onChange={e => setCustomName(e.target.value)}
            placeholder="Company name" style={{ flex:'2 1 140px', minWidth: 120 }} />
          <button className="btn btn-primary btn-sm" onClick={addCustom}
            disabled={!customTicker || !customName || add.isPending}
            style={{ flexShrink: 0 }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {add.error && <ErrorBox message={(add.error as Error).message} />}

      {/* Watchlist items */}
      {wl.isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
          {[0,1,2].map(i => <Skel key={i} h={140} />)}
        </div>
      ) : !items.length ? (
        <div className="card">
          <Empty icon={<Star size={36} />} title="Your watchlist is empty"
            desc="Add tickers above to track their sentiment." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
          {items.map(item => <WatchCard key={item.ticker} item={item} onRemove={() => remove.mutate(item.ticker)} />)}
        </div>
      )}
    </div>
  )
}

function WatchCard({ item, onRemove }: { item: WatchlistItem & { added_at: string }; onRemove: () => void }) {
  const total = item.positive + item.negative + item.neutral
  const posPct = total ? Math.round(item.positive / total * 100) : 0
  const negPct = total ? Math.round(item.negative / total * 100) : 0
  const dom = posPct > negPct ? 'bull' : negPct > posPct ? 'bear' : 'neu'
  const domColor = dom === 'bull' ? 'var(--green)' : dom === 'bear' ? 'var(--red)' : 'var(--muted)'
  const Icon = dom === 'bull' ? TrendingUp : dom === 'bear' ? TrendingDown : Minus

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-.01em' }}>
            {item.ticker}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{item.entity_name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: domColor }}>
            <Icon size={16} />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>
              {dom === 'bull' ? posPct : dom === 'bear' ? negPct : '—'}%
            </span>
          </div>
          <button onClick={onRemove} className="btn-icon"
            style={{ color: 'var(--fg-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-3)')}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="sent-bar">
            <div style={{ flex: posPct, background: 'var(--green)', borderRadius: '2px 0 0 2px', minWidth: posPct > 0 ? 3 : 0 }} />
            <div style={{ flex: 100-posPct-negPct, background: 'var(--muted)', minWidth: 1 }} />
            <div style={{ flex: negPct, background: 'var(--red)', borderRadius: '0 2px 2px 0', minWidth: negPct > 0 ? 3 : 0 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--green)' }}>↑ {posPct}%</span>
            <span style={{ color: 'var(--fg-3)' }}>{fmtNum(item.mentions)} mentions</span>
            <span style={{ color: 'var(--red)' }}>↓ {negPct}%</span>
          </div>
          {item.avg_score != null && (
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>
              Avg confidence: {(item.avg_score * 100).toFixed(1)}%
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic' }}>
          No sentiment data yet
        </div>
      )}
    </div>
  )
}
