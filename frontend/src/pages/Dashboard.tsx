import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Newspaper, TrendingUp, Database, Globe, Clock } from 'lucide-react'
import { Q } from '../api/queries'
import { StatCard, SentimentGauge, MarketMood, TopEntities } from '../components/dashboard'
import { TrendChart } from '../components/charts'
import { NewsFilters, NewsFeed } from '../components/news'
import { ErrorBox } from '../components/ui'
import type { Filters } from '../types'
import { fmtNum } from '../utils'

const EMPTY_FILTERS: Filters = { source:'', sentiment:'', ticker:'', search:'', dateFrom:'', dateTo:'' }

export default function Dashboard() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  // All data fetched with React Query — automatic caching, retries, background refetch
  const stats    = useQuery({ queryKey: Q.keys.stats,    queryFn: Q.stats,    staleTime: 30_000 })
  const summary  = useQuery({ queryKey: Q.keys.summary,  queryFn: Q.summary,  staleTime: 30_000 })
  const entities = useQuery({ queryKey: Q.keys.entities, queryFn: () => Q.entities(10), staleTime: 60_000 })
  const trend    = useQuery({ queryKey: Q.keys.trend(24), queryFn: () => Q.trend(24), staleTime: 60_000 })
  const articles = useQuery({
    queryKey: Q.keys.articles({ ...filters, page }),
    queryFn:  () => Q.articles({ ...filters, page, limit: 15 }),
    staleTime: 30_000,
    placeholderData: prev => prev,
  })

  const ingest = useMutation({
    mutationFn: Q.ingest,
    onSuccess: () => {
      qc.invalidateQueries()
    },
  })

  function updateFilters(partial: Partial<Filters>) {
    setFilters(f => ({ ...f, ...partial }))
    setPage(1)
  }

  return (
    <div className="page-inner fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1>Market Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--mono)' }}>
            Financial news sentiment · real-time analysis
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => ingest.mutate()}
            disabled={ingest.isPending}
          >
            <RefreshCw size={13} className={ingest.isPending ? 'spin' : ''} />
            {ingest.isPending ? 'Fetching…' : 'Fetch News'}
          </button>
          {ingest.isSuccess && (
            <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>
              ✓ {(ingest.data as any)?.stored ?? 0} new · {(ingest.data as any)?.processed ?? 0} analyzed
            </span>
          )}
          {stats.data?.pending != null && stats.data.pending > 0 && (
            <span style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--mono)',
              display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {stats.data.pending} pending analysis
            </span>
          )}
        </div>
      </div>

      {/* Errors */}
      {summary.error && <ErrorBox message="Failed to load sentiment data" onRetry={() => qc.invalidateQueries({ queryKey: Q.keys.summary })} />}

      {/* Stat cards */}
      <div className="grid-stats">
        <StatCard label="Articles Today" loading={stats.isLoading}
          value={stats.data ? fmtNum(stats.data.articles_today) : '—'}
          sub="last 24h" icon={<Newspaper size={14} />} color="var(--blue)" />
        <StatCard label="Total Articles" loading={stats.isLoading}
          value={stats.data ? fmtNum(stats.data.articles_total) : '—'}
          sub="all time" icon={<Database size={14} />} color="var(--purple)" />
        <StatCard label="Analyzed" loading={stats.isLoading}
          value={stats.data ? fmtNum(stats.data.analyzed_total) : '—'}
          sub="sentiment scored" icon={<TrendingUp size={14} />} color="var(--green)" />
        <StatCard label="Sources" loading={stats.isLoading}
          value={stats.data?.sources_count ?? '—'}
          sub="active feeds" icon={<Globe size={14} />} color="var(--amber)" />
      </div>

      {/* Main 3-col */}
      <div className="grid-main">
        <SentimentGauge data={summary.data} loading={summary.isLoading} />
        <MarketMood     data={summary.data} loading={summary.isLoading} />
        <TopEntities    data={entities.data} loading={entities.isLoading} />
      </div>

      {/* Trend chart */}
      <TrendChart data={trend.data?.data} loading={trend.isLoading} hours={24} height={220} />

      {/* News feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={{ fontSize: 15 }}>Latest Financial News</h2>
          <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>
            {articles.data?.total ?? 0} articles
          </span>
        </div>

        <NewsFilters filters={filters} onChange={updateFilters}
          onClear={() => { setFilters(EMPTY_FILTERS); setPage(1) }} />

        <NewsFeed
          articles={articles.data?.articles ?? []}
          total={articles.data?.total ?? 0}
          page={page} limit={15}
          loading={articles.isLoading}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
