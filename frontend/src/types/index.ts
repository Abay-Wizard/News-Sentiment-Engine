export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface AccessTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface Entity { name: string; ticker: string | null }

export interface Article {
  id: string
  title: string
  url: string
  summary: string | null
  source: string
  author: string | null
  published_at: string | null
  fetched_at: string | null
  sentiment_label: 'positive' | 'negative' | 'neutral' | null
  sentiment_score: number | null
  positive_score: number | null
  negative_score: number | null
  neutral_score: number | null
  entities: Entity[]
}

export interface ArticlesResponse {
  total: number
  page: number
  limit: number
  articles: Article[]
}

export interface SentimentSummary {
  total: number
  positive: number
  negative: number
  neutral: number
  avg_score: number | null
  bullish_pct: number
  bearish_pct: number
  neutral_pct: number
  momentum: 'up' | 'down' | 'neutral'
  momentum_delta: number
}

export interface EntitySentiment {
  entity_name: string
  ticker: string | null
  entity_type: string
  total_mentions: number
  article_count: number
  positive_count: number
  negative_count: number
  neutral_count: number
}

export interface SourceStat {
  source: string
  total_articles: number
  positive: number
  negative: number
  neutral: number
  avg_score: number | null
}

export interface TrendPoint {
  hour: string
  total: number
  positive: number
  negative: number
  neutral: number
  avg_score: number | null
}

export interface TrendResponse {
  hours: number
  data: TrendPoint[]
}

export interface DashboardStats {
  articles_today: number
  articles_total: number
  analyzed_total: number
  sources_count: number
  pending: number
}

export interface WatchlistItem {
  ticker: string
  entity_name: string
  added_at: string
  mentions: number
  positive: number
  negative: number
  neutral: number
  avg_score: number | null
}

export interface Filters {
  source: string
  sentiment: string
  ticker: string
  search: string
  dateFrom: string
  dateTo: string
}
