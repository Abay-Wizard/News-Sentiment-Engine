import { useQuery } from '@tanstack/react-query'
import { Q } from '../api/queries'
import { SourceChart } from '../components/charts'
import { Skel } from '../components/ui'
import { sourceName, sourceColor, sentimentColor } from '../utils'

export default function Sources() {
  const comparison = useQuery({ queryKey: Q.keys.sources, queryFn: Q.sources, staleTime: 60_000 })
  const reuters    = useQuery({ queryKey: Q.keys.articles({ source:'reuters',       page:1 }), queryFn: () => Q.articles({ source:'reuters',       limit:6 }), staleTime: 60_000 })
  const cnbc       = useQuery({ queryKey: Q.keys.articles({ source:'cnbc',          page:1 }), queryFn: () => Q.articles({ source:'cnbc',          limit:6 }), staleTime: 60_000 })
  const yahoo      = useQuery({ queryKey: Q.keys.articles({ source:'yahoo_finance', page:1 }), queryFn: () => Q.articles({ source:'yahoo_finance', limit:6 }), staleTime: 60_000 })

  const feeds = [
    { key:'reuters',       hook: reuters },
    { key:'cnbc',          hook: cnbc },
    { key:'yahoo_finance', hook: yahoo },
  ]

  return (
    <div className="page-inner fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1>Source Analysis</h1>
        <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--mono)' }}>
          Reuters · CNBC · Yahoo Finance · sentiment comparison
        </p>
      </div>

      <SourceChart data={comparison.data} loading={comparison.isLoading} height={240} />

      {/* Per-source stat cards */}
      {comparison.isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {[0,1,2].map(i => <Skel key={i} h={180} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {(comparison.data ?? []).map(src => {
            const total  = src.total_articles || 1
            const posPct = Math.round(src.positive / total * 100)
            const negPct = Math.round(src.negative / total * 100)
            const neuPct = Math.round(src.neutral  / total * 100)
            const color  = sourceColor(src.source)
            return (
              <div key={src.source} className="card"
                style={{ borderTop: `2px solid ${color}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color }}>{sourceName(src.source)}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-3)' }}>{src.total_articles} articles</span>
                </div>
                <div className="sent-bar">
                  <div style={{ flex: posPct, background: 'var(--green)', borderRadius: '2px 0 0 2px', minWidth: posPct > 0 ? 3 : 0 }} />
                  <div style={{ flex: neuPct,  background: 'var(--muted)', minWidth: neuPct > 0 ? 3 : 0 }} />
                  <div style={{ flex: negPct,  background: 'var(--red)', borderRadius: '0 2px 2px 0', minWidth: negPct > 0 ? 3 : 0 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, textAlign: 'center' }}>
                  {[['Bullish',posPct,'var(--green)'],['Neutral',neuPct,'var(--muted)'],['Bearish',negPct,'var(--red)']].map(([l,p,c])=>(
                    <div key={String(l)}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: String(c), fontFamily: 'var(--mono)' }}>{p}%</div>
                      <div style={{ fontSize: 10, color: 'var(--fg-3)' }}>{l}</div>
                    </div>
                  ))}
                </div>
                {src.avg_score != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px',
                    background: 'var(--elevated)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                    <span className="label">Avg Confidence</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
                      {((src.avg_score) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Per-source recent articles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        {feeds.map(({ key, hook }) => (
          <div key={key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 700,
              color: sourceColor(key), letterSpacing: '.07em', textTransform: 'uppercase' }}>
              {sourceName(key)} · Recent
            </div>
            {hook.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={50} />)
              : (hook.data?.articles ?? []).map(article => (
                  <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
                      borderRadius: 'var(--r)', background: 'var(--elevated)', textDecoration: 'none',
                      transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--elevated)')}>
                    {article.sentiment_label && (
                      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, flexShrink: 0, marginTop: 2,
                        background: sentimentColor(article.sentiment_label) }} />
                    )}
                    <span style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.45,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.title}
                    </span>
                  </a>
                ))
            }
          </div>
        ))}
      </div>
    </div>
  )
}
