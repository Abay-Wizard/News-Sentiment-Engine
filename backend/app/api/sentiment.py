from fastapi import APIRouter, Depends, Query
from app.core.database import get_conn
from app.core.deps import current_user
from app.db.article_queries import (
    sentiment_summary, sentiment_trend, top_entities,
    source_comparison, dashboard_stats, watchlist_sentiment,
)
from app.schemas.articles import (
    SentimentSummary, TrendResponse, TrendPoint,
    EntitySentiment, SourceStat, DashboardStats, WatchlistItem,
)

router = APIRouter(prefix="/sentiment", tags=["sentiment"])


@router.get("/summary", response_model=SentimentSummary)
async def summary(conn=Depends(get_conn), _user=Depends(current_user)):
    raw = await sentiment_summary(conn)
    if not raw or not raw.get("total"):
        return SentimentSummary(total=0, positive=0, negative=0, neutral=0)

    total = raw["total"]
    pos_recent = raw.get("pos_recent") or 0
    pos_prev   = raw.get("pos_prev") or 0

    # Momentum: compare last 6h bullish to prior 6h
    if pos_prev == 0:
        momentum, delta = "neutral", 0.0
    elif pos_recent > pos_prev:
        delta = round((pos_recent - pos_prev) / max(pos_prev, 1) * 100, 1)
        momentum = "up"
    else:
        delta = round((pos_prev - pos_recent) / max(pos_prev, 1) * 100, 1)
        momentum = "down"

    return SentimentSummary(
        total=total,
        positive=raw["positive"],
        negative=raw["negative"],
        neutral=raw["neutral"],
        avg_score=raw.get("avg_score"),
        bullish_pct=round(raw["positive"] / total * 100, 1),
        bearish_pct=round(raw["negative"] / total * 100, 1),
        neutral_pct=round(raw["neutral"]  / total * 100, 1),
        momentum=momentum,
        momentum_delta=delta,
    )


@router.get("/trend", response_model=TrendResponse)
async def trend(
    hours: int = Query(24, ge=1, le=168),
    conn=Depends(get_conn),
    _user=Depends(current_user),
):
    data = await sentiment_trend(conn, hours)
    return TrendResponse(hours=hours, data=[TrendPoint(**r) for r in data])


@router.get("/entities", response_model=list[EntitySentiment])
async def entities(
    limit: int = Query(10, ge=1, le=50),
    conn=Depends(get_conn),
    _user=Depends(current_user),
):
    return await top_entities(conn, limit)


@router.get("/sources", response_model=list[SourceStat])
async def sources(conn=Depends(get_conn), _user=Depends(current_user)):
    return await source_comparison(conn)


@router.get("/stats", response_model=DashboardStats)
async def stats(conn=Depends(get_conn), _user=Depends(current_user)):
    return await dashboard_stats(conn)


@router.get("/watchlist", response_model=list[WatchlistItem])
async def watchlist_data(user=Depends(current_user), conn=Depends(get_conn)):
    return await watchlist_sentiment(conn, user["id"])
