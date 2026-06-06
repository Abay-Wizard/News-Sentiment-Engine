from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EntityOut(BaseModel):
    name: str
    ticker: Optional[str] = None


class ArticleOut(BaseModel):
    id: str
    title: str
    url: str
    summary: Optional[str] = None
    source: str
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    fetched_at: Optional[datetime] = None
    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None
    positive_score: Optional[float] = None
    negative_score: Optional[float] = None
    neutral_score: Optional[float] = None
    entities: list[EntityOut] = []
    class Config: from_attributes = True


class ArticlesResponse(BaseModel):
    total: int
    page: int
    limit: int
    articles: list[ArticleOut]


class SentimentSummary(BaseModel):
    total: int
    positive: int
    negative: int
    neutral: int
    avg_score: Optional[float] = None
    bullish_pct: float = 0
    bearish_pct: float = 0
    neutral_pct: float = 0
    momentum: str = "neutral"     # "up" | "down" | "neutral"
    momentum_delta: float = 0     # % change vs previous period


class EntitySentiment(BaseModel):
    entity_name: str
    ticker: Optional[str] = None
    entity_type: str
    total_mentions: int
    article_count: int
    positive_count: int
    negative_count: int
    neutral_count: int


class SourceStat(BaseModel):
    source: str
    total_articles: int
    positive: int
    negative: int
    neutral: int
    avg_score: Optional[float] = None


class TrendPoint(BaseModel):
    hour: datetime
    total: int
    positive: int
    negative: int
    neutral: int
    avg_score: Optional[float] = None


class TrendResponse(BaseModel):
    hours: int
    data: list[TrendPoint]


class DashboardStats(BaseModel):
    articles_today: int
    articles_total: int
    analyzed_total: int
    sources_count: int
    pending: int


class WatchlistItem(BaseModel):
    ticker: str
    entity_name: str
    added_at: Optional[datetime] = None
    mentions: int = 0
    positive: int = 0
    negative: int = 0
    neutral: int = 0
    avg_score: Optional[float] = None