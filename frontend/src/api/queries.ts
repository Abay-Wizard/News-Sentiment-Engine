import { api } from './client'
import type {
  ArticlesResponse, SentimentSummary, EntitySentiment,
  SourceStat, TrendResponse, DashboardStats, WatchlistItem, Filters,
} from '../types'

const get = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<T>(url, { params }).then(r => r.data)

export const Q = {
  // Keys
  keys: {
    stats:       ['stats']                   as const,
    summary:     ['summary']                 as const,
    trend:       (h: number) => ['trend', h] as const,
    entities:    ['entities']                as const,
    sources:     ['sources']                 as const,
    articles:    (f: Partial<Filters> & { page?: number }) => ['articles', f] as const,
    watchlist:   ['watchlist']               as const,
    wlSentiment: ['watchlist-sentiment']     as const,
  },

  // Fetchers
  stats:       () => get<DashboardStats>('/sentiment/stats'),
  summary:     () => get<SentimentSummary>('/sentiment/summary'),
  trend:       (hours: number) => get<TrendResponse>('/sentiment/trend', { hours }),
  entities:    (limit = 10) => get<EntitySentiment[]>('/sentiment/entities', { limit }),
  sources:     () => get<SourceStat[]>('/sentiment/sources'),
  wlSentiment: () => get<WatchlistItem[]>('/sentiment/watchlist'),

  articles: (f: Partial<Filters> & { page?: number; limit?: number }) =>
    get<ArticlesResponse>('/news/', {
      source:    f.source    || undefined,
      sentiment: f.sentiment || undefined,
      ticker:    f.ticker    || undefined,
      search:    f.search    || undefined,
      date_from: f.dateFrom  || undefined,
      date_to:   f.dateTo    || undefined,
      page:      f.page  ?? 1,
      limit:     f.limit ?? 20,
    }),

  watchlist: () => get<WatchlistItem[]>('/watchlist/'),

  addWatchlist: (ticker: string, entity_name: string) =>
    api.post('/watchlist/', { ticker, entity_name }).then(r => r.data),

  removeWatchlist: (ticker: string) =>
    api.delete(`/watchlist/${ticker}`).then(r => r.data),

  ingest: () => api.post('/news/ingest').then(r => r.data),
}
