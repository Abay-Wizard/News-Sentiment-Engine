import { useState } from 'react'
import { ExternalLink, Search, SlidersHorizontal, X, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Article, Filters } from '../../types'
import { sentimentColor, sentimentBg, sentimentBorder, sourceName, sourceColor, sourceAccent, timeAgo } from '../../utils'
import { Badge, SentimentBadge, Skel, Empty } from '../ui'

// ── NewsCard ──────────────────────────────────────────────────────────────────
export function NewsCard({ article }: { article: Article }) {
  const lbl = article.sentiment_label

  return (
    <article className="card card-hover"
      onClick={() => window.open(article.url, '_blank')}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700,
            letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
            color: sourceColor(article.source), background: sourceAccent(article.source),
            padding: '2px 7px', borderRadius: 4 }}>
            {sourceName(article.source)}
          </span>
          <SentimentBadge label={lbl} score={article.sentiment_score} />
          {article.entities.filter(e => e.ticker).slice(0, 3).map(e => (
            <Badge key={e.ticker} variant="blu">{e.ticker}</Badge>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
            {timeAgo(article.published_at ?? article.fetched_at)}
          </span>
          <ExternalLink size={12} style={{ color: 'var(--fg-3)' }} />
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 'clamp(13px,3vw,14px)', fontWeight: 600, color: 'var(--fg)',
        lineHeight: 1.45, letterSpacing: '-.01em' }}>
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.summary}
        </p>
      )}

      {/* Score bars */}
      {lbl && article.positive_score != null && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            ['↑', article.positive_score, 'var(--green)'],
            ['~', article.neutral_score ?? 0, 'var(--muted)'],
            ['↓', article.negative_score ?? 0, 'var(--red)'],
          ].map(([sym, val, color]) => (
            <div key={String(sym)} style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
              <span style={{ fontSize: 11, color: String(color), fontFamily: 'var(--mono)', width: 12, flexShrink: 0 }}>{sym}</span>
              <div style={{ flex: 1, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Number(val) * 100}%`, background: String(color), transition: 'width .5s ease' }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--mono)', width: 26, textAlign: 'right', flexShrink: 0 }}>
                {(Number(val) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {article.author && (
        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{article.author}</div>
      )}
    </article>
  )
}

// ── NewsFilters ───────────────────────────────────────────────────────────────
const selStyle: React.CSSProperties = {
  appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
}

export function NewsFilters({ filters, onChange, onClear }: {
  filters: Filters
  onChange: (f: Partial<Filters>) => void
  onClear: () => void
}) {
  const [showDates, setShowDates] = useState(false)
  const hasActive = Object.values(filters).some(Boolean)

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '12px 14px', display: 'flex',
      flexDirection: 'column', gap: 10 }}>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 140 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--fg-3)', pointerEvents: 'none' }} />
          <input value={filters.search} onChange={e => onChange({ search: e.target.value })}
            placeholder="Search articles…" style={{ paddingLeft: 30, minWidth: 'unset' }} />
        </div>

        {/* Ticker */}
        <div style={{ position: 'relative', flex: '1 1 120px', minWidth: 100 }}>
          <input value={filters.ticker}
            onChange={e => onChange({ ticker: e.target.value.toUpperCase() })}
            placeholder="Ticker…" style={{ minWidth: 'unset' }} />
        </div>

        {/* Source */}
        <select value={filters.source} onChange={e => onChange({ source: e.target.value })}
          style={{ ...selStyle, flex: '1 1 120px', minWidth: 110 }}>
          <option value="">All Sources</option>
          {['reuters', 'cnbc', 'yahoo_finance'].map(s => (
            <option key={s} value={s}>{sourceName(s)}</option>
          ))}
        </select>

        {/* Sentiment */}
        <select value={filters.sentiment} onChange={e => onChange({ sentiment: e.target.value })}
          style={{ ...selStyle, flex: '1 1 120px', minWidth: 110 }}>
          <option value="">All Sentiment</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>

        <button className="btn-icon" onClick={() => setShowDates(v => !v)}
          title="Date filters" style={{ color: showDates ? 'var(--blue)' : undefined }}>
          <SlidersHorizontal size={15} />
        </button>

        {hasActive && (
          <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--red-dim)', border: '1px solid var(--red-border)',
            color: 'var(--red)', borderRadius: 'var(--r)', padding: '8px 12px',
            fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {showDates && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8,
          paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 180px' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>From</span>
            <input type="date" value={filters.dateFrom}
              onChange={e => onChange({ dateFrom: e.target.value })} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 180px' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>To</span>
            <input type="date" value={filters.dateTo}
              onChange={e => onChange({ dateTo: e.target.value })} style={{ flex: 1 }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── NewsFeed ──────────────────────────────────────────────────────────────────
export function NewsFeed({ articles, total, page, limit, loading, onPageChange }: {
  articles: Article[]; total: number; page: number; limit: number;
  loading: boolean; onPageChange: (p: number) => void
}) {
  const totalPages = Math.ceil(total / limit)

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}><Skel h={18} w={80} /><Skel h={18} w={70} /></div>
          <Skel h={16} w="85%" /><Skel h={13} w="65%" /><Skel h={3} />
        </div>
      ))}
    </div>
  )

  if (!articles.length) return (
    <div className="card">
      <Empty icon={<Newspaper size={36} />} title="No articles found"
        desc="Try adjusting your filters or fetch fresh news." />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>
        {total} results · page {page} of {totalPages}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {articles.map(a => <NewsCard key={a.id} article={a} />)}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 8 }}>
          <PBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <ChevronLeft size={14} />
          </PBtn>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let n: number
            if (totalPages <= 7) n = i + 1
            else if (page <= 4) n = i + 1
            else if (page >= totalPages - 3) n = totalPages - 6 + i
            else n = page - 3 + i
            return <PBtn key={n} onClick={() => onPageChange(n)} active={n === page}>{n}</PBtn>
          })}
          <PBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            <ChevronRight size={14} />
          </PBtn>
        </div>
      )}
    </div>
  )
}

function PBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--r-sm)', fontSize: 12, fontFamily: 'var(--mono)', cursor: disabled ? 'not-allowed' : 'pointer',
        border: active ? '1px solid var(--green)' : '1px solid var(--border)',
        background: active ? 'var(--green-dim)' : 'var(--elevated)',
        color: active ? 'var(--green)' : disabled ? 'var(--fg-3)' : 'var(--fg-2)',
        transition: 'all .15s' }}>
      {children}
    </button>
  )
}
